// src/theme/theme.js
import { createTheme } from '@mui/material/styles';

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            background: {
              default: '#F4F3EEFF',
              paper: '#F9F8ECFF'
            },
            text: {
              primary: '#003049',
              secondary: '#013551FF'
            },
            custom: {
              tooltipBg: '#F9F8ECFF',
              tooltipText: '#003049',
              chartAccent: '#f77f00',
              danger: '#D85F5F'
            }
          }
        : {
            background: {
              default: '#003049',
              paper: '#013551FF'
            },
            text: {
              primary: '#fdfcdc',
              secondary: '#fdfcdc'
            },
            custom: {
              tooltipBg: '#003049',
              tooltipText: '#fdfcdc',
              chartAccent: '#fcbf49',
              danger: '#FF6666'
            }
          })
    },
    typography: {
      fontFamily:
        '"GT-Zirkon-Regular", "Neue Haas Unica Pro", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: 20,
      body1: {
        fontSize: '20opx',
        lineHeight: '1.6', // or you could use a numeric value (e.g., 1.6)
        fontFamily: '"GT-Zirkon-Regular", sans-serif'
      },
      // Updated Heading Styles using CSS Variables
      h1: {
        fontSize: 'var(--h00)', // 3.5rem
        fontWeight: 600,
        lineHeight: 1.2
      },
      h2: {
        fontSize: 'var(--h1)', // 2.5rem
        fontWeight: 600,
        lineHeight: 1.2
      },
      h3: {
        fontSize: 'var(--h2)', // 1.5rem
        fontWeight: 600,
        lineHeight: 1.2
      },
      h4: {
        fontSize: 'var(--h3)', // 1rem
        fontWeight: 600,
        lineHeight: 1.2
      },
      h5: {
        fontSize: 'var(--h4)', // 0.875rem
        fontWeight: 500,
        lineHeight: 1.3
      },
      h6: {
        fontSize: 'var(--h5)', // 0.75 rem
        fontWeight: 500,
        lineHeight: 1.3
      }
    }
  });

export default getTheme;

