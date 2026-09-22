import { ComponentType } from 'react';

/**
 * Mounts a modal's content only while it is open, so its form state starts fresh from props on every
 * open (no "reset on open" effects) and its mutations start idle.
 */
export function whileOpen<P extends { visible: boolean }>(Content: ComponentType<P>) {
  function WhileOpen(props: P) {
    return props.visible ? <Content {...props} /> : null;
  }
  WhileOpen.displayName = `WhileOpen(${Content.displayName ?? Content.name})`;
  return WhileOpen;
}
