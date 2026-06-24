-- Seed curated mini-apps for API discovery
INSERT INTO miniapps (app_id, name, url, icon, description, category, featured, verified)
VALUES
  ('deepbook', 'DeepBook', 'https://deepbook.tech', '📖', 'Native on-chain orderbook DEX on Sui.', 'DeFi', TRUE, TRUE),
  ('cetus', 'Cetus', 'https://app.cetus.zone', '🐬', 'Leading DEX and liquidity protocol on Sui.', 'DeFi', TRUE, TRUE),
  ('scallop', 'Scallop', 'https://app.scallop.io', '🏦', 'Lend, borrow, and earn on Sui.', 'Lending', TRUE, TRUE),
  ('turbos', 'Turbos Finance', 'https://app.turbos.finance', '💱', 'Concentrated liquidity DEX on Sui.', 'DeFi', TRUE, TRUE),
  ('aftermath', 'Aftermath Finance', 'https://aftermath.finance', '⚡', 'AMM, liquid staking, and DeFi suite on Sui.', 'DeFi', FALSE, TRUE),
  ('suins', 'SuiNS', 'https://suins.io', '🏷️', 'Register human-readable .sui names.', 'Tools', TRUE, TRUE),
  ('suivision', 'SuiVision', 'https://suivision.xyz', '📊', 'Block explorer and analytics for Sui.', 'Tools', FALSE, TRUE),
  ('wormhole-bridge', 'Wormhole Bridge', 'https://portalbridge.com/sui', '🌉', 'Bridge assets to and from Sui.', 'Bridge', TRUE, TRUE),
  ('flowx', 'FlowX Finance', 'https://flowx.finance', '💧', 'DEX aggregator and liquidity hub on Sui.', 'DeFi', FALSE, TRUE)
ON CONFLICT (app_id) DO NOTHING;
