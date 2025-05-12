import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';

const ImageGalleryRow = () => {
  // Image data with sources and captions
  const images = [
    {
      src: '/images/general/bangladesh/Dhaka_1986_2025.jpg',
      alt: 'Dhaka, Bangladesh: 1986 vs 2025',
      caption: 'The expansion of Dhaka, Bangladesh, from 1986 to 2025. [Airbus, Maxar Technologies]'
    },
    {
      src: '/images/general/maldives/1997_2023_industry_boom.png',
      alt: 'Maldives Industry Boom: 1997 vs 2023',
      caption: 'The boom of the tourism industry and the expansion of the Maldives from 1997 to 2023. [UNDP-Maldives]'
    },
    {
      src: '/images/general/philippines/Manila_1988_2014.jpg',
      alt: 'The Expansion of Manila, Philippines: 1988 vs 2014',
      caption: 'The expansion of Manila, Philippines, from 1988 to 2014. [NASA]'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Box sx={{ width: '100%', px: 2, pb: 1, mt: 4 }}>
        <Grid container spacing={3} justifyContent="center">
          {images.map((image, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '4px',
                  boxShadow: 3,
                  height: { xs: '250px', md: '300px' },
                  width: '100%',
                  backgroundColor: 'background.paper',
                }}
              >
                <Box
                  component="img"
                  src={image.src}
                  alt={image.alt}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                component="p"
                align="center"
                sx={{
                  mt: 1.5,
                  px: 1,
                  fontStyle: 'italic',
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  lineHeight: 1.3,
                }}
              >
                {image.caption}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Box>
    </motion.div>
  );
};

export default ImageGalleryRow;