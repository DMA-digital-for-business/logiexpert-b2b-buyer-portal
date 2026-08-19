import { faker } from 'tests/test-utils';

import { LangFormatFunction } from '@/lib/lang';
import { setGlobalCommonState } from '@/store';

import { addProductFromPage } from './useOpenPDP';

describe('addProductFromPage', () => {
  it('opens the registration dialog with translated content for a guest', () => {
    const translations = {
      'global.registrationDialog.title': faker.lorem.words(),
      'global.registrationDialog.shoppingListMessage': faker.lorem.sentence(),
      'global.dialog.cancel': faker.lorem.word(),
      'global.registrationDialog.register': faker.lorem.word(),
    };
    const b3Lang: LangFormatFunction = (key) => translations[key as keyof typeof translations];
    const storeDispatch = vi.fn();
    const saveFn = vi.fn();

    addProductFromPage({
      role: 100,
      storeDispatch,
      saveFn,
      setOpenPage: vi.fn(),
      registerEnabled: true,
      b3Lang,
    });

    expect(storeDispatch).toHaveBeenCalledWith(
      setGlobalCommonState({
        globalMessage: {
          open: true,
          title: translations['global.registrationDialog.title'],
          message: translations['global.registrationDialog.shoppingListMessage'],
          cancelText: translations['global.dialog.cancel'],
          saveText: translations['global.registrationDialog.register'],
          saveFn,
        },
      }),
    );
  });
});
