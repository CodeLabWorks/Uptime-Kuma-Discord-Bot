function loadAntiCrash(client, color) {
    process.on('unhandledRejection', (reason, promise) => {
      console.error(color.red('❌ Unhandled Rejection at:'), promise, 'reason:', reason);
    });
  
    process.on('uncaughtException', (error) => {
      console.error(color.red('❌ Uncaught Exception:'), error);
    });
  
    process.on('uncaughtExceptionMonitor', (error) => {
      console.error(color.red('❌ Uncaught Exception Monitor:'), error);
    });
  
    process.on('warning', (warning) => {
      console.warn(color.yellow('⚠️ Warning:'), warning);
    });
  
    console.log(color.green('🛡️ Anti-crash handlers loaded.'));
  }
  
  module.exports = { loadAntiCrash };
  