import type { MiniApp } from '@/store/miniAppStore';
import { apiRequestOptional } from './client';
import type { BackendMiniApp } from './types';

function mapBackendMiniApp(app: BackendMiniApp): MiniApp {
  return {
    id: app.appId,
    name: app.name,
    url: app.url,
    icon: app.icon ?? '📱',
    description: app.description ?? '',
    category: app.category ?? 'Other',
    featured: app.featured,
    verified: app.verified,
  };
}

export async function fetchBackendMiniApps(): Promise<MiniApp[] | null> {
  const data = await apiRequestOptional<{ apps: BackendMiniApp[] }>('/miniapps', {
    auth: false,
  });

  if (!data?.apps) return null;
  return data.apps.map(mapBackendMiniApp);
}
