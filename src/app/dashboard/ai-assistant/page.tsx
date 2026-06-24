import type { Metadata } from 'next';

import { CONFIG } from '@/config-global';
import { AIAssistantView } from '@/sections/ai-assistant/view/ai-assistant-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `AI Assistant - ${CONFIG.appName}`,
};

export const dynamic = 'force-dynamic';

export default function AIAssistantPage() {
  return <AIAssistantView />;
}
