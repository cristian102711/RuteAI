// Mock de sweetalert2 para tests
const Swal = {
  fire: jest.fn(() => Promise.resolve({ isConfirmed: true, isDismissed: false })),
};
module.exports = Swal;
module.exports.default = Swal;
