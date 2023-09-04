/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        searchBar: '#242424',
        'accent-cyan': '#34fcff',
        'bg-custom': '#121212',
        'hover-custom': '#1a1a1a',
        'active-custom': '#232323',
        'active-hover-custom': '#393939',
        'table-header': '1a1a1a'
      },
    },
  },
  plugins: [],
}
