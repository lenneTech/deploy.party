import { setLocale } from 'yup';

export default defineNuxtPlugin(async (_nuxtApp) => {
  setLocale({
    // use constant translation keys for messages without values
    mixed: {
      default: 'please enter valid ${label}',
      notType: 'please enter valid ${path}',
      required: 'required',
    },
    // string: {
    //     email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    // }
  });

  // Custom validation rules
  // https://github.com/jquense/yup?tab=readme-ov-file#addmethodschematype-schema-name-string-method--schema-void
  // addMethod(string, 'plz', () => {
  //     return
  // });
});
