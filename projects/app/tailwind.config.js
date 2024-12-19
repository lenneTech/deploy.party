const {iconsPlugin, getIconCollections} = require('@egoist/tailwindcss-icons');
const typography = require('@tailwindcss/typography');
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    safelist: ['opacity-50'],
    theme: {
        fontFamily: {
            poppins: ['Poppins'],
            sans: ['Poppins', ...defaultTheme.fontFamily.sans],
            serif: ['Poppins', ...defaultTheme.fontFamily.serif],
            mono: ['Ubuntu Mono', ...defaultTheme.fontFamily.mono],
        },
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#00ff97',
                    '50': '#edfff7',
                    '100': '#d5ffee',
                    '200': '#aeffde',
                    '300': '#70ffc6',
                    '400': '#2bfda7',
                    '500': '#00ff97',
                    '600': '#00c06d',
                    '700': '#009659',
                    '800': '#067549',
                    '900': '#07603e',
                    '950': '#003721',
                },
                background: '#0F0F0F',
                foreground: '#FFFFFF',
                border: 'hsl(0 0% 100% / 0.1)',
                hover: 'hsl(0 0% 100% / 0.05)',
                active: 'hsl(0 0% 100% / 0.05)',
                secondary: {
                    DEFAULT: '#000000',
                    '100': '#fff',
                    '150': '#fff',
                    '200': '#31343C',
                    '300': '#282d38',
                    '400': '#191b1f'
                },
            },
            keyframes: {
                typing: {
                    "0%": {
                        width: "0%",
                        visibility: "hidden"
                    },
                    "100%": {
                        width: "100%"
                    }
                },
                blink: {
                    "50%": {
                        borderColor: "transparent"
                    },
                    "100%": {
                        borderColor: "white"
                    }
                }
            },
            animation: {
                typing: "typing 2s steps(20) infinite alternate, blink .7s infinite"
            }
        },
    },
    plugins: [
        typography,
        require('@tailwindcss/forms'),
        iconsPlugin({
            // Select the icon collections you want to use
            collections: getIconCollections(['bi']),
        }),
    ],
};
