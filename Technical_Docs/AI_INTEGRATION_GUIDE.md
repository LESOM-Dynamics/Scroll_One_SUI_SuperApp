# ScrollOne SuperApp AI Integration Guide

This guide explains how to integrate **ScrollOne SuperApp AI** into your Super App. There are two main approaches:

1. **AI as a Mini-App** (External AI service via WebView)
2. **Native AI Integration** (Built-in AI features)

---

## Approach 1: AI as a Mini-App (Recommended for External AI Services)

This approach integrates an external AI service (like ChatGPT, Claude, or a custom AI dApp) as a mini-app that users can access through the Explore tab.

### Step 1: Add AI Mini-App to Registry

Edit `miniapps/registry.ts` and add your AI mini-app:

```typescript
// miniapps/registry.ts
export const MINIAPPS: MiniApp[] = [
  // ... existing apps ...
  
  // --- AI / Assistant ---
  {
    id: 'scrollone-ai',
    name: 'ScrollOne AI',
    url: 'https://your-ai-service.com', // Replace with your AI service URL
    icon: '🤖',
    description: 'AI-powered assistant for Web3, DeFi, and Scroll ecosystem guidance.',
    category: 'AI',
    featured: true,
    verified: true,
  },
  {
    id: 'scroll-ai-chat',
    name: 'Scroll AI Chat',
    url: 'https://your-chat-ai.com',
    icon: '💬',
    description: 'Chat with AI about Scroll blockchain, transactions, and dApps.',
    category: 'AI',
    featured: false,
    verified: true,
  },
];
```

### Step 2: Verify Category Support

The AI category should automatically appear in the Explore tab. If it doesn't, check that the category is included in the category tabs.

### Step 3: Test Integration

1. Run the app: `bun run start`
2. Navigate to the **Explore** tab
3. Filter by **AI** category
4. Click on your AI mini-app
5. The AI service will load in a WebView with full bridge support

### Step 4: Enable Bridge Features for AI

If your AI service needs to interact with the wallet (e.g., to check balances, explain transactions), it can use the ScrollOne bridge:

```javascript
// In your AI service (loaded in WebView)
// The bridge is automatically injected as window.scrollOne

// Get user's wallet address
const account = await window.scrollOne.getAccount();
console.log('User wallet:', account.address);

// Get balance for context
const balance = await window.scrollOne.getBalance();
console.log('Balance:', balance);

// Get network info
const network = await window.scrollOne.getNetwork();
console.log('Network:', network.chainName);
```

---

## Approach 2: Native AI Integration (Built-in Features)

This approach adds AI functionality directly into the Super App as native features (chatbot, transaction analysis, etc.).

### Architecture Overview

```
┌─────────────────────────────────────┐
│      AI Service Layer                │
│  services/ai/                        │
│  ├── aiService.ts                   │
│  ├── chatService.ts                 │
│  └── transactionAnalyzer.ts         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      AI Store (Zustand)             │
│  store/aiStore.ts                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      AI UI Components               │
│  components/ai/                     │
│  ├── AIChatbot.tsx                 │
│  ├── TransactionAnalyzer.tsx       │
│  └── AIAssistant.tsx               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      AI Screens                     │
│  app/(tabs)/(ai)/                   │
│  ├── index.tsx (Chat interface)     │
│  └── assistant.tsx                 │
└─────────────────────────────────────┘
```

### Step 1: Install AI Dependencies

Add AI SDK dependencies to `package.json`:

```bash
# For OpenAI integration
bun add openai

# For Anthropic Claude
bun add @anthropic-ai/sdk

# For general HTTP requests (if not already installed)
# axios is already in dependencies
```

### Step 2: Create AI Service Layer

Create `services/ai/aiService.ts`:

```typescript
// services/ai/aiService.ts
import OpenAI from 'openai';
// OR import Anthropic from '@anthropic-ai/sdk';

// Initialize AI client
// Option 1: OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Store in environment variables
});

// Option 2: Anthropic Claude
// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

export interface AIContext {
  walletAddress?: string;
  balance?: string;
  network?: string;
  recentTransactions?: any[];
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  /**
   * Chat with AI about general topics
   */
  async chat(messages: AIMessage[], context?: AIContext): Promise<string> {
    try {
      // Add system context about Scroll blockchain
      const systemMessage: AIMessage = {
        role: 'system',
        content: this.buildSystemPrompt(context),
      };

      const allMessages = [systemMessage, ...messages];

      // OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4', // or 'gpt-3.5-turbo'
        messages: allMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      // Anthropic Claude alternative:
      // const response = await anthropic.messages.create({
      //   model: 'claude-3-opus-20240229',
      //   max_tokens: 1024,
      //   messages: allMessages,
      // });
      // return response.content[0].text;
    } catch (error) {
      console.error('[AIService] Error in chat:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Analyze a transaction and explain it in plain language
   */
  async analyzeTransaction(transaction: any, context?: AIContext): Promise<string> {
    const prompt = `Analyze this blockchain transaction and explain it in simple terms:

Transaction Details:
- From: ${transaction.from}
- To: ${transaction.to}
- Value: ${transaction.value} ETH
- Gas: ${transaction.gas}
- Status: ${transaction.status}

User Context:
- Network: ${context?.network || 'Scroll'}
- User Balance: ${context?.balance || 'Unknown'}

Explain what this transaction does, any risks, and what the user should know.`;

    return this.chat([
      {
        role: 'user',
        content: prompt,
      },
    ], context);
  }

  /**
   * Get DeFi recommendations based on user's wallet
   */
  async getDeFiRecommendations(context: AIContext): Promise<string> {
    const prompt = `Based on this user's wallet activity on Scroll blockchain, provide personalized DeFi recommendations:

Wallet Address: ${context.walletAddress}
Balance: ${context.balance}
Network: ${context.network}

Recent Transactions: ${JSON.stringify(context.recentTransactions?.slice(0, 5) || [])}

Provide 3-5 specific, actionable DeFi recommendations for this user.`;

    return this.chat([
      {
        role: 'user',
        content: prompt,
      },
    ], context);
  }

  /**
   * Build system prompt with Scroll blockchain context
   */
  private buildSystemPrompt(context?: AIContext): string {
    return `You are ScrollOne AI, an AI assistant specialized in the Scroll blockchain ecosystem.

Your knowledge includes:
- Scroll is an Ethereum Layer 2 scaling solution
- Scroll uses zkEVM technology
- Mainnet chain ID: 534352
- Testnet chain ID: 534351
- Popular dApps: SyncSwap, Skydrome, LayerBank, Aave v3
- Scroll Bridge for bridging assets from Ethereum

User Context:
${context?.walletAddress ? `- Wallet Address: ${context.walletAddress}` : ''}
${context?.balance ? `- Balance: ${context.balance}` : ''}
${context?.network ? `- Network: ${context.network}` : ''}

Provide helpful, accurate, and user-friendly responses about:
- Scroll blockchain and how it works
- DeFi protocols on Scroll
- Transaction explanations
- Security best practices
- dApp recommendations

Always prioritize user security and explain risks clearly.`;
  }
}

export const aiService = new AIService();
```

### Step 3: Create AI Store

Create `store/aiStore.ts`:

```typescript
// store/aiStore.ts
import { create } from 'zustand';
import { aiService, type AIMessage, type AIContext } from '@/services/ai/aiService';
import { useWalletStore } from './walletStore';
import { scrollProvider } from '@/services/scroll/provider';

interface AIState {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  isChatOpen: boolean;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  toggleChat: () => void;
  analyzeTransaction: (transaction: any) => Promise<string>;
  getRecommendations: () => Promise<string>;
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  isChatOpen: false,

  sendMessage: async (content: string) => {
    const { messages } = get();
    
    // Add user message
    const userMessage: AIMessage = { role: 'user', content };
    set({ 
      messages: [...messages, userMessage],
      isLoading: true,
      error: null,
    });

    try {
      // Get wallet context
      const walletStore = useWalletStore.getState();
      const config = scrollProvider.getConfig();
      
      const context: AIContext = {
        walletAddress: walletStore.address || undefined,
        balance: walletStore.balance || undefined,
        network: config.chainName,
        recentTransactions: walletStore.transactions?.slice(0, 5),
      };

      // Get AI response
      const response = await aiService.chat([...messages, userMessage], context);
      
      // Add assistant message
      const assistantMessage: AIMessage = { role: 'assistant', content: response };
      set({ 
        messages: [...get().messages, assistantMessage],
        isLoading: false,
      });
    } catch (error) {
      console.error('[AIStore] Error sending message:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get AI response',
        isLoading: false,
      });
    }
  },

  clearChat: () => {
    set({ messages: [], error: null });
  },

  toggleChat: () => {
    set({ isChatOpen: !get().isChatOpen });
  },

  analyzeTransaction: async (transaction: any) => {
    set({ isLoading: true, error: null });
    
    try {
      const walletStore = useWalletStore.getState();
      const config = scrollProvider.getConfig();
      
      const context: AIContext = {
        walletAddress: walletStore.address || undefined,
        balance: walletStore.balance || undefined,
        network: config.chainName,
      };

      const analysis = await aiService.analyzeTransaction(transaction, context);
      set({ isLoading: false });
      return analysis;
    } catch (error) {
      console.error('[AIStore] Error analyzing transaction:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to analyze transaction',
        isLoading: false,
      });
      throw error;
    }
  },

  getRecommendations: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const walletStore = useWalletStore.getState();
      const config = scrollProvider.getConfig();
      
      const context: AIContext = {
        walletAddress: walletStore.address || undefined,
        balance: walletStore.balance || undefined,
        network: config.chainName,
        recentTransactions: walletStore.transactions?.slice(0, 10),
      };

      const recommendations = await aiService.getDeFiRecommendations(context);
      set({ isLoading: false });
      return recommendations;
    } catch (error) {
      console.error('[AIStore] Error getting recommendations:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get recommendations',
        isLoading: false,
      });
      throw error;
    }
  },
}));
```

### Step 4: Create AI Chat Component

Create `components/ai/AIChatbot.tsx`:

```typescript
// components/ai/AIChatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Send, Bot, User, X } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAIStore } from '@/store/aiStore';

export function AIChatbot() {
  const { messages, isLoading, error, sendMessage, clearChat, toggleChat, isChatOpen } = useAIStore();
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom when new message arrives
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  if (!isChatOpen) {
    return (
      <TouchableOpacity
        style={styles.chatButton}
        onPress={toggleChat}
        activeOpacity={0.8}
      >
        <Bot color={colors.text.primary} size={24} />
      </TouchableOpacity>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bot color={colors.accent.primary} size={24} />
          <Text style={styles.headerTitle}>ScrollOne AI</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={clearChat} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleChat} style={styles.headerButton}>
            <X color={colors.text.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Bot color={colors.text.secondary} size={48} />
            <Text style={styles.emptyStateText}>
              Hi! I'm ScrollOne AI. Ask me anything about Scroll blockchain, DeFi, or your wallet.
            </Text>
          </View>
        )}

        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
          >
            {message.role === 'assistant' && (
              <View style={styles.avatar}>
                <Bot color={colors.accent.primary} size={20} />
              </View>
            )}
            {message.role === 'user' && (
              <View style={[styles.avatar, styles.userAvatar]}>
                <User color={colors.text.primary} size={20} />
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userText : styles.assistantText,
                ]}
              >
                {message.content}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.accent.primary} />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about Scroll, DeFi, or your wallet..."
          placeholderTextColor={colors.text.tertiary}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send
            color={(!input.trim() || isLoading) ? colors.text.tertiary : colors.text.primary}
            size={20}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  chatButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.base,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.base,
    paddingBottom: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  userAvatar: {
    backgroundColor: colors.background.elevated,
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.accent.primary,
  },
  assistantBubble: {
    backgroundColor: colors.background.elevated,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: 20,
  },
  userText: {
    color: colors.text.primary,
  },
  assistantText: {
    color: colors.text.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  errorContainer: {
    padding: spacing.md,
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.secondary,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.background.elevated,
  },
});
```

### Step 5: Add AI Tab to Navigation

Create `app/(tabs)/(ai)/index.tsx`:

```typescript
// app/(tabs)/(ai)/index.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { AIChatbot } from '@/components/ai/AIChatbot';
import { colors } from '@/theme';

export default function AIScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'AI Assistant',
          headerShown: true,
        }}
      />
      <Screen>
        <View style={styles.container}>
          <AIChatbot />
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
```

Update `app/(tabs)/_layout.tsx` to include the AI tab:

```typescript
// Add to the tabs array in app/(tabs)/_layout.tsx
{
  name: '(ai)',
  href: '/(tabs)/(ai)',
  icon: '🤖', // or use a proper icon component
}
```

### Step 6: Add Environment Variables

Create `.env` file (and add to `.gitignore`):

```env
OPENAI_API_KEY=your_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Step 7: Integrate AI into Transaction Details

Add AI analysis to transaction detail screen:

```typescript
// app/(tabs)/(wallet)/transaction/[id].tsx
// Add AI analysis button/feature

import { useAIStore } from '@/store/aiStore';

// In your component:
const { analyzeTransaction } = useAIStore();

const handleAnalyzeTransaction = async () => {
  try {
    const analysis = await analyzeTransaction(transaction);
    // Show analysis in a modal or expandable section
    Alert.alert('AI Analysis', analysis);
  } catch (error) {
    // Handle error
  }
};
```

---

## Security Considerations

1. **API Keys**: Never commit API keys to version control. Use environment variables.
2. **Rate Limiting**: Implement rate limiting to prevent abuse.
3. **Data Privacy**: Be transparent about what data is sent to AI services.
4. **Cost Management**: Monitor API usage to control costs.

---

## Testing

1. **Test AI Chat**: Send various messages and verify responses
2. **Test Transaction Analysis**: Analyze different transaction types
3. **Test Error Handling**: Test with invalid API keys, network errors
4. **Test Performance**: Ensure UI remains responsive during AI calls

---

## Next Steps

1. Choose your approach (Mini-App vs Native)
2. Set up API keys and environment variables
3. Implement the chosen approach
4. Test thoroughly
5. Deploy and monitor usage

---

## Additional Features to Consider

- **Voice Input**: Add speech-to-text for voice queries
- **Transaction Summaries**: Auto-generate summaries of transaction history
- **Smart Notifications**: AI-powered alerts for important wallet events
- **DeFi Strategy Suggestions**: Personalized investment recommendations
- **Security Warnings**: AI-powered risk assessment for transactions

---

For questions or issues, refer to the main documentation or contact the development team.

