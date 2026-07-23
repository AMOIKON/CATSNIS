import { toast, ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  theme: 'colored',
};

const notify = {
  success: (message: string) => toast.success(message, defaultOptions),
  error:   (message: string) => toast.error(message, { ...defaultOptions, autoClose: 5000 }),
  info:    (message: string) => toast.info(message, defaultOptions),
  warning: (message: string) => toast.warning(message, defaultOptions),

  /**
   * ✅ Helper pour les erreurs Axios — extrait le message backend si présent,
   * sinon affiche un message générique. À utiliser dans les catch des
   * appels CRUD : catch (err: any) { notify.apiError(err, "Erreur lors de la création"); }
   */
  apiError: (err: any, fallback: string) => {
    const message = err?.response?.data?.message || fallback;
    toast.error(message, { ...defaultOptions, autoClose: 5000 });
  },
};

export default notify;