// Mock de sonner (toast) para tests
const toast = Object.assign(jest.fn(), {
  success: jest.fn(),
  error:   jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  promise: jest.fn(),
});
const Toaster = () => null;
module.exports = { toast, Toaster };
