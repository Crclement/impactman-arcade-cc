import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  theme: {
    fontFamily: {
      sans: 'Agrandir'
    },
    container: {
      center: true,
      screens: {
        sm: '600px',
        md: '728px',
        lg: '965px',
        xl: '1440px'
      },
      padding: {
        DEFAULT: '8px',
        sm: '10px',
        lg: '30px',
        xl: '30px'
      }
    },
    extend: {
      colors: {
        green: '#DFFF80',
        blue: '#242A53',
        rose: '#FAE5ED',
        navyBlue: '#16114F',
        purple: '#C092ED',
        bgBlue: '#DAF5FC',
        limeGreen: '#D9FF69',
        snowWhite: '#FFFAFC',
        brightLilac: '#C092ED',
        accentBlue: '#CAFDFF',
        accentGreen: '#DFFF80',
        accentYellowishGreen: '#DFFCE2',
        blizzardBlue: '#BBF2FF'
      },
      borderRadius: {
        'none': '0',
        DEFAULT: '4px',
        'sm': '8px',
        'md': '10px',
        'lg': '16px',
        '2lg': '20px',
        'full': '9999px'
      },
      // helps flips horizontally
      scale: {
        '-100': '-1',
      },
      backgroundImage: {
          'gradient-blue': "linear-gradient(128.51deg, #C7EAF2 14.63%, #86D5E7 79.6%)"
      }
    }
  }
}