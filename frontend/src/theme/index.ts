"use client";

import {
  extendTheme,
  type ThemeConfig,
  type StyleFunctionProps,
} from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: "#ede9fe",
    100: "#ddd6fe",
    200: "#c4b5fd",
    300: "#a78bfa",
    400: "#8b5cf6",
    500: "#7c3aed",
    600: "#6d28d9",
    700: "#5b21b6",
    800: "#4c1d95",
    900: "#3b0764",
  },
  accent: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },
};

const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
};

const styles = {
  global: (props: StyleFunctionProps) => ({
    body: {
      bg: props.colorMode === "dark" ? "gray.900" : "white",
      color: props.colorMode === "dark" ? "whiteAlpha.900" : "gray.900",
    },
    "*::selection": {
      bg: "brand.400",
      color: "white",
    },
  }),
};

const components = {
  Button: {
    baseStyle: {
      borderRadius: "xl",
      fontWeight: "600",
      _hover: {
        transform: "translateY(-1px)",
        boxShadow: "lg",
      },
      transition: "all 0.2s ease",
    },
    variants: {
      solid: (props: StyleFunctionProps) => ({
        bg: props.colorScheme === "brand" ? "brand.500" : undefined,
        _hover: {
          bg: props.colorScheme === "brand" ? "brand.600" : undefined,
          transform: "translateY(-1px)",
          boxShadow: "lg",
        },
      }),
      glass: {
        bg: "whiteAlpha.100",
        backdropFilter: "blur(10px)",
        border: "1px solid",
        borderColor: "whiteAlpha.200",
        _hover: {
          bg: "whiteAlpha.200",
          transform: "translateY(-1px)",
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: "2xl",
        overflow: "hidden",
        transition: "all 0.2s ease",
      },
    },
    variants: {
      glass: {
        container: {
          bg: "whiteAlpha.50",
          backdropFilter: "blur(20px)",
          border: "1px solid",
          borderColor: "whiteAlpha.100",
          _hover: {
            borderColor: "brand.400",
            boxShadow: "0 0 20px rgba(124, 58, 237, 0.15)",
          },
        },
      },
    },
  },
  Input: {
    variants: {
      filled: {
        field: {
          borderRadius: "xl",
          bg: "whiteAlpha.50",
          border: "1px solid",
          borderColor: "whiteAlpha.100",
          _focus: {
            bg: "whiteAlpha.100",
            borderColor: "brand.400",
            boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)",
          },
        },
      },
    },
    defaultProps: {
      variant: "filled",
    },
  },
  Textarea: {
    variants: {
      filled: {
        borderRadius: "xl",
        bg: "whiteAlpha.50",
        border: "1px solid",
        borderColor: "whiteAlpha.100",
        _focus: {
          bg: "whiteAlpha.100",
          borderColor: "brand.400",
          boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)",
        },
      },
    },
    defaultProps: {
      variant: "filled",
    },
  },
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  styles,
  components,
  radii: {
    xl: "1rem",
    "2xl": "1.5rem",
    "3xl": "2rem",
  },
});

export default theme;
