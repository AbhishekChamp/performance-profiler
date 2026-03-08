// Simple worker without Comlink class wrapper
import { runAnalysisPipeline } from '@/core/pipeline';
// Using types from pipeline directly, no need to import here

console.log('[Worker] Worker script loading...');

// Handle messages directly without Comlink
self.addEventListener('message', async (event) => {
  console.log('[Worker] Received message:', event.data);
  
  const { type, files, options, id } = event.data;
  
  if (type === 'analyze') {
    try {
      console.log('[Worker] Starting analysis with', files.length, 'files');
      
      // Post progress update
      self.postMessage({ 
        type: 'progress', 
        progress: { stage: 'uploading', progress: 10, message: 'Reading files...' },
        id 
      });
      
      // Run the analysis
      const report = await runAnalysisPipeline(files, options);
      
      console.log('[Worker] Analysis complete, report ID:', report.id);
      
      // Post success result
      self.postMessage({ 
        type: 'complete', 
        report,
        id 
      });
    } catch (error) {
      console.error('[Worker] Error during analysis:', error);
      
      // Post error result
      self.postMessage({ 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        id 
      });
    }
  }
});

console.log('[Worker] Worker message handler registered');;
