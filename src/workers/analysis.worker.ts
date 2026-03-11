// Simple worker without Comlink class wrapper
import { runAnalysisPipeline } from '@/core/pipeline';
// Using types from pipeline directly, no need to import here

// Handle messages directly without Comlink
self.addEventListener('message', async (event) => {
  const { type, files, options, id } = event.data;
  
  if (type === 'analyze') {
    try {
      
      // Post progress update
      self.postMessage({ 
        type: 'progress', 
        progress: { stage: 'uploading', progress: 10, message: 'Reading files...' },
        id 
      });
      
      // Run the analysis
      const report = await runAnalysisPipeline(files, options);
      
      // Post success result
      self.postMessage({ 
        type: 'complete', 
        report,
        id 
      });
    } catch (error) {
      // Post error result
      self.postMessage({ 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        id 
      });
    }
  }
});
