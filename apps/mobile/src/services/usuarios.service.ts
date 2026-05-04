import type { IUsuario } from '@ruteai/shared-types';

export const loginUsuario = async (email: string, password: string): Promise<IUsuario> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === 'repartidor@ruteai.cl' && password === '123456') {
        resolve({
          id: 'user-1',
          nombre: 'Juan Pérez',
          email: 'repartidor@ruteai.cl',
          rol: 'repartidor',
          telefono: '+56912345678',
          empresaId: 'empresa-1',
          createdAt: new Date(),
        });
      } else {
        reject(new Error('Credenciales inválidas'));
      }
    }, 1000);
  });
};
