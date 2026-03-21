export const config = {
  window: {
    width: 1000,
    height: 700
  },
  isDev: process.env.NODE_ENV === 'development',
  security: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  }
};
