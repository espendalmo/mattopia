import nb from './locale-nb.js';

export function createTranslator(messages, fallback=nb) {
  return (key, values={}) => {
    const template=Object.hasOwn(messages,key)?messages[key]:Object.hasOwn(fallback,key)?fallback[key]:key;
    return template.replace(/\{([a-zA-Z]\w*)\}/g, (placeholder, name) =>
      Object.hasOwn(values,name)?String(values[name]):placeholder);
  };
}

export const text=createTranslator(nb);
