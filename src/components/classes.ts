import { createClasses } from '@/theme/create-classes';

// ----------------------------------------------------------------------

export const svgColorClasses = {
  root: createClasses('svg__color__root'),
};

export const logoClasses = {
  root: createClasses('logo__root'),
};

export const iconifyClasses = {
  root: createClasses('iconify__root'),
};

export const scrollbarClasses = {
  root: createClasses('scrollbar__root'),
};

export const labelClasses = {
  root: createClasses('label__root'),
  icon: createClasses('label__icon'),
};

export const chartClasses = {
  root: createClasses('chart__root'),
  loading: createClasses('chart__loading'),
  legends: {
    root: createClasses('chart__legends__root'),
    item: {
      wrap: createClasses('chart__legends__item__wrap'),
      root: createClasses('chart__legends__item__root'),
      icon: createClasses('chart__legends__item__icon'),
      dot: createClasses('chart__legends__item__dot'),
      label: createClasses('chart__legends__item__label'),
      value: createClasses('chart__legends__item__value'),
    },
  },
};

export const colorPickerClasses = {
  root: createClasses('color__picker__root'),
  item: {
    root: createClasses('color__picker__item__root'),
    container: createClasses('color__picker__item__container'),
    icon: createClasses('color__picker__item__icon'),
  },
};

export const colorPreviewClasses = {
  root: createClasses('color__preview__root'),
  item: createClasses('color__preview__item'),
  label: createClasses('color__preview__label'),
};
