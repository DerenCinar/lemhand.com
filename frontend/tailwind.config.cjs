/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#9ec3fb',
          DEFAULT: '#408cff',
          dark: '#0468ff',
          hover: '#6da7ff'
        }
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          "primary": "#408cff",
          "secondary": "#9ec3fb",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "primary": "#408cff",
          "secondary": "#9ec3fb",
        },
      },
    ],
  },
}
