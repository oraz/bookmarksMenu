import M from 'ts-mockito';

/**
 * call this function in beforeAll()
 */
export function simulateCustomeElements(): void {
  const customElementsDefinitions: {
    customTagName: string;
    clazz: Function;
    config: ElementDefinitionOptions;
  }[] = [];

  const customElementsMock = M.mock<CustomElementRegistry>();
  M.when(
    customElementsMock.define(M.anyString(), M.anyFunction(), M.anything())
  ).thenCall(
    (
      customTagName: string,
      clazz: Function,
      config: ElementDefinitionOptions
    ) => {
      customElementsDefinitions.push({ customTagName, clazz, config });
    }
  );
  window.customElements = M.instance(customElementsMock);

  const nativeCreateElement = document.createElement.bind(document);
  document.createElement = (
    nodeName: string,
    options?: ElementCreationOptions
  ) => {
    const el: HTMLElement = nativeCreateElement(nodeName);
    if (options === undefined) {
      return el;
    } else {
      const definition = customElementsDefinitions.find(
        each =>
          each.config.extends === nodeName && each.customTagName === options.is
      );
      return Object.setPrototypeOf(el, definition.clazz.prototype);
    }
  };
}
