import React, { cloneElement, Children } from "react";
import { Popover as HeadlessPopover } from "@headlessui/react";

export function Popover({ children }) {
  return <HeadlessPopover className="relative">{children}</HeadlessPopover>;
}

export function PopoverTrigger({ children, asChild = false }) {
  if (asChild && React.isValidElement(children)) {
    return cloneElement(children, {
      ...children.props,
      ref: children.ref,
    });
  }

  return (
    <HeadlessPopover.Button className="outline-none">
      {children}
    </HeadlessPopover.Button>
  );
}

export function PopoverContent({ children }) {
  return (
    <HeadlessPopover.Panel className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-md p-2">
      {children}
    </HeadlessPopover.Panel>
  );
}
