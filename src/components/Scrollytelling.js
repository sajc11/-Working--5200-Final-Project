// src/components/Scrollytelling.js
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme, Box, Typography, Paper, Button } from '@mui/material';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

// Layout Components
import NarrativeContainer from './NarrativeContainer';

// Embed Components
import ImageGalleryRow from './ImageGalleryRow'; // adjust path as needed

// UI Components
import getDataPath from '../utils/getDataPath'; // or '../utils/getDataPath' if needed

// Visualization Components

// Chart Visualizations
import FloodDaysChart from './visualizations/FloodDaysChart';
import LaggedCorrelationChart from './visualizations/LaggedCorrelationChart';
import LeadLagCorrelationHeatmap from './visualizations/LeadLagCorrelationHeatmap';
import PopulationAtRiskChart from './visualizations/PopulationAtRiskChart';
import SeaLevelChart from './visualizations/SeaLevelChart';

// Map Visualizations
import FloodSeverityMap from './maps/FloodSeverityMap';
import PopulationChoroplethMap from './maps/PopulationChoroplethMap';
import RegionMap from './maps/RegionMap';

// Import CSS for styling
import '../styles/main.css'; // Adjust the path as necessary

// Define motion variants for a gradual fade-in and slide-up animation
const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: 'easeInOut'
        }
    }
};

const Scrollytelling = ({ data, filters, setFilters }) => {
    // Theme for styling
    const theme = useTheme();

    // Function to handle filter changes
    return (
        <>
            {/* Section 1: Introduction */}
            <motion.section
                id="introduction"
                style={{ scrollSnapAlign: 'start', marginBottom: '2rem' }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={sectionVariants}
            >
                <NarrativeContainer>
                    <Typography
                        variant="h2"
                        gutterBottom
                        align="center"
                        sx={{ pt: 3, mb: 4, fontWeight: 'bold', color: 'text.primary' }}
                        >
                        CLIMATE RISK AND RESILIENCE IN RAPIDLY URBANIZING ASIAN NATIONS
                    </Typography>
                    <Typography
                        variant="h4"
                        gutterBottom
                        align="left"
                        sx={{ mb: 1, pt: 4, color: 'text.secondary' }} // Adds a bit of space between h4 and the paragraphs
                    >
                        INTRODUCTION
                    </Typography>
                    <Typography variant="body1" paragraph>
                        In a remote village on Bangladesh’s delta, villagers now watch the tide roll in not once but twice a day – flooding their yards each time. Thousands of kilometers away, the government of the Maldives is drawing up plans to literally float a new city on the ocean. And in the Philippines, residents of Manila recall a night in 2013 when a typhoon’s storm surge turned city streets into rivers.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        These stories share a common thread: rising seas and extreme weather are upending lives in South Asia’s coastal communities. In low-lying Bangladesh and island nations like the Maldives, the ocean – long a source of livelihood – is becoming an existential threat, creeping in inch by inch. Meanwhile, the Philippines, hit by some of the world’s strongest storms, is struggling to shield its cities from floodwaters.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        This article explores how climate change is raising the stakes for Bangladesh, the Maldives, and the Philippines, and what these countries are doing to build resilience. Through data-driven insights and human stories, we’ll see the risks and the responses in this frontline region, where the battle against sea-level rise is being fought in real time.
                    </Typography>
                    <Paper
                        elevation={2}
                        sx={{
                            p: 2,
                            mt: 3,
                            mb: 2,
                            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
                            borderLeft: theme => `6px solid ${theme.palette.primary.main}`,
                            color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#f5f5f5'
                        }}
                    >
                        <Typography
                            variant="h5"
                            align="center"
                            gutterBottom
                            sx={{ fontWeight: 'bold', pt: 3, mb: 2, color: 'text.primary' }}
                        >
                            “Sea level rise is not a distant future — it's a slow-motion tsunami already lapping at the doors of coastal cities.”
                        </Typography>
                    </Paper>
                </NarrativeContainer>
                <ImageGalleryRow />
            </motion.section>

            {/* Section 2: Effects of Climate Change */}
            <motion.section
                id="climateDrivers"
                style={{ scrollSnapAlign: 'start' }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: 0.15 }}
                variants={sectionVariants}
            >
                <NarrativeContainer>
                    <Typography variant="h4" gutterBottom sx={{ mt: 0, mb: 3, color: 'text.primary' }}>
                        THE EFFECTS OF CLIMATE CHANGE
                    </Typography>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        Why are South Asia’s coasts under such strain? The answer starts with the global climate drivers
                        that are altering our planet. Greenhouse gas emissions from burning fossil fuels have heated the
                        Earth by about 1.1°C above pre-industrial levels – sounds small, but it’s enough to turbocharge the
                        climate system. Warmer temperatures are melting glaciers and ice sheets, adding more water to
                        the oceans. Heat also makes water expand. Together these factors cause sea levels to rise. Global sea level
                        is now increasing by over 3 millimeters every year , and this rate is getting faster.
                        In fact, satellites show that the pace of rise has roughly doubled since the 1990s. For a place like the Maldives,
                        which averages only 1 meter above sea level, every millimeter matters. Higher sea levels mean that high tides
                        reach farther inland and storm surges become more dangerous.
                    </Typography>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        It’s not just rising seas – climate change also supercharges weather extremes. In South Asia, the monsoon rains have
                        become more erratic, with heavier downpours causing flash floods and longer dry spells causing droughts. The oceans are warmer,
                        which feeds energy to cyclonic storms. The Philippines, sitting in the Northwest Pacific, now routinely faces super typhoons that
                        break records for wind speed and rainfall. In November 2020, for instance, Typhoon Goni slammed into the Philippines with 315 km/h
                        winds, one of the strongest landfalls ever recorded. Scientists say these ultra-intense storms are becoming more likely as the planet warms.
                        The Philippines is also seeing more frequent and intense flooding, with the number of flood days increasing significantly in recent years
                    </Typography>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        Heatwaves are another driver – across South Asia, higher temperatures make cities swelter, and warmer air can hold more moisture,
                        leading to intense bursts of rain. Finally, the ocean is becoming more acidic as it absorbs CO₂; this damages coral reefs that normally
                        protect coasts from waves. In short, climate change is creating a perfect storm of challenges for coastal areas: higher seas, heavier rains,
                        stronger storms, and weakened natural defenses.
                    </Typography>

                    <Box sx={{ width: '100%', my: 3 }}>
                        <SeaLevelChart />
                    </Box>

                    <Typography variant="body1" sx={{ textAlign: 'justify' }}>
                        Sea level rise is accelerating, and for low-lying nations like the Maldives, every additional millimeter of ocean matters.
                        This chart visualizes global and regional sea level trends across decades, and what it shows is unmistakable: a steady, climbing line.   
                        From the early 1990s to today, the pace has doubled — from just under 2 mm per year to over 4 mm annually.
                        When compounded over decades, this rise dramatically increases the baseline for flooding, storm surges, and coastal erosion.
                    </Typography>  

                    <Box sx={{ mx: 'auto', display: 'block', my: 1, width: { xs: '100%', md: '90%' } }}>
                        <Box
                            component="img"
                            src="/images/general/maldives/maldives_flood_rainfall.png"
                            alt="Maldives adaptation measures"
                            sx={{
                                alignContent: 'center',
                                width: '100%',
                                height: 'auto',
                                borderRadius: 2,
                                boxShadow: 3,
                                mt: 3
                            }}
                        />
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                textAlign: 'center',
                                fontStyle: 'italic',
                                fontSize: '0.7rem',
                                color: 'text.secondary',
                                mt: 1,
                                mb: 3
                            }}
                        >
                            Heavy rainfalls result in flooded roads in Male’ City. The reason for the flooding can only be blamed on the poor road construction and the mismanagement of it (Maldives Financial Review, 2023)
                        </Typography>   
                    </Box>
                    
                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        We also observe volatility — brief dips followed by sharper increases — suggesting that sea level change is not linear but reactive.
                        Climate oscillations, thermal expansion, and glacier melt pulses all leave their imprint on this curve.
                        For Bangladesh and the Maldives, this means the “slow” disaster of sea-level rise does not unfold gently — it comes in lurches, compounding vulnerabilities in unpredictable ways.
                    </Typography>     
                    
                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        The rising seas are only part of the story. South Asia’s monsoon cycle is becoming more erratic, delivering bursts of intense
                        rain that overwhelm drainage systems and lead to prolonged flooding. The stakes are clear: a consistent upward trend that
                        reshapes coastlines and redefines what it means to be “at risk.” The following interactive visualization shows how major flood days — events that
                        disrupt livelihoods and infrastructure — are increasing across countries like Bangladesh and the Philippines. Its data stands as a warning signal, 
                        underscoring the urgency of anticipatory climate adaptation before thresholds are breached and damage becomes irreversible.
                    </Typography>                               

                    <Box sx={{ width: '100%', my: 3 }}>
                        <FloodDaysChart />
                    </Box>
                    
                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        The trend isn’t linear. Some years bring devastating surges, others seem quieter — but the underlying volatility is increasing.
                        These swings strain both rural and urban communities: farmers face crop loss, while city dwellers endure waterlogged streets and health hazards.
                        The correlation between sea-level anomalies and flooding is becoming clearer, and this chart captures that precarious reality.
                    </Typography>
                    <Box sx={{
                                backgroundColor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 2,
                                p: 3,
                                mb: 3,
                                boxShadow: 1,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                boxShadow: 3,
                                },
                                position: "relative"
                            }}>
                            <Typography variant="body1" paragraph sx={{mx: 'auto', fontStyle: 'italic', textAlign: 'justify', color: 'text.secondary' }}>
                                Notably, the Maldives does not appear in this chart; not because flooding is absent - but because no flood day data was available in the dataset we sourced.
                                This is a key limitation in climate research: lack of monitoring can mask real impacts. In fact, other records show that the Maldives experiences regular
                                flood events during the southwest monsoon season, driven by intense rainfall, tidal surges, and inadequate drainage. In 2022 alone, the Maldives reported over
                                120 flood incidents across its islands. As sea levels and storm activity increase, it's critical that data collection improves so no
                                vulnerable region remains invisible.
                            </Typography>
                        </Box>
                </NarrativeContainer>
            </motion.section>

            {/* Section 3: Climate Vulnerabilities */}
            <motion.section
                id="vulnerabilities"
                style={{ scrollSnapAlign: 'start' }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: 0.15 }}
                variants={sectionVariants}
            >
                <NarrativeContainer>
                    <Typography variant="h3" align="left" gutterBottom sx={{ mt: 0, mb: 3, color: 'text.primary'}}>
                        CLIMATE-VULNERABILITIES IN HIGH RISK NATIONS
                    </Typography>

                    <Typography variant="body1" sx={{ textAlign: 'justify' }}>
                        Despite facing the same rising seas, Bangladesh, the Maldives, and the Philippines have different vulnerabilities:
                    </Typography>

                    <Typography variant="h4" align="left" gutterBottom sx={{ mt: 3, mb: 3, color: 'text.secondary' }}>
                        BANGLADESH
                    </Typography>
                                
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body1" paragraph sx={{textAlign: 'justify' }}>
                            This country is essentially a huge river delta. About 170 million people live in an area roughly the size of New York State – making Bangladesh one of the most
                            densely populated nations. Most of its land is pancake-flat and low-lying; two-thirds of Bangladesh is less than 5 meters above sea level. It’s crisscrossed
                            by the mighty Ganges, Brahmaputra, and Meghna rivers, which means flooding is a fact of life. 
                        
                            <Box sx={{ float: 'left', mr: 3, width: { xs: '100%', md: 420 } }}>
                                <Box
                                    component="img"
                                    src="/images/general/bangladesh/flooded_coastline.png"
                                    alt="Bangladeshi family walking on eroded, salinized land"
                                    sx={{
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: 2,
                                        boxShadow: 3,
                                        mt: 1.5,
                                    }}
                                />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            textAlign: 'center',
                                            fontStyle: 'italic',
                                            fontSize: '0.75rem',
                                            color: 'text.secondary',
                                            mt: 1,
                                            mb: 1
                                        }}
                                    >
                                            A woman gathers water on farmland degraded by saltwater intrusion in coastal Bangladesh.
                                    </Typography>
                                <Box
                                    component="img"
                                    src="/images/general/bangladesh/farming_salinity.png"
                                    alt="Salinized farmland in Bangladesh"
                                    sx={{
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: 2,
                                        boxShadow: 3,
                                        mt:1
                                    }}
                                />

                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        fontStyle: 'italic',
                                        fontSize: '0.75rem',
                                        color: 'text.secondary',
                                        textAlign: 'center',
                                        mt: 1,
                                        mb: 0.5
                                    }}
                                > 
                                    Coastal erosion and salt intrusion force families inland along Bangladesh’s southern shore (© Climate Visuals).
                                </Typography>
                            </Box>
                            </Typography>
                            <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                                Coral reefs and mangroves that used to shield shores have been degraded in many areas by development or pollution, increasing vulnerability. 
                                On top of that, poverty in some regions makes recovery from disasters very hard, stretching coping capacity.Each year, the monsoon floods a large portion of the country. 
                                Bangladesh also lies in the path of tropical cyclones brewing in the Bay of Bengal. The combination of low elevation and frequent storms is perilous.
                            </Typography>
                            <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                                In 1970, a cyclone infamously killed an estimated 300,000 to 500,000 people in what is now Bangladesh. Though disaster preparedness has improved greatly (cyclone deaths have dropped 100-fold
                                thanks to early warnings and shelters), Bangladesh remains extremely vulnerable. The Climate Risk Index has repeatedly ranked it in the top ten nations affected by extreme weather.
                                Add sea-level rise to the mix: as oceans inch upward, Bangladesh’s floods worsen. Saltwater is intruding into coastal farmlands, and some fishing villages have been
                                swallowed by the sea. One dramatic projection warns that by 2050, rising seas could permanently inundate 17% of Bangladesh’s land and displace perhaps 20 million people.
                            </Typography>
                    </Box>                        

                    <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, color: 'text.secondary' }}>
                        MALDIVES
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        
                        <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                            The Maldives is the flattest country on Earth – a tropical paradise of coral atolls, famed for white beaches and luxury resorts. But its highest natural point is only about 2.4 meters (8 feet) above sea level.
                            Most islands sit just a meter or so above the waves.  

                            <Box sx={{ float: 'right', ml: 3, mb: 0.5, width: { xs: '100%', sm: 315 } }}>
                                <Box
                                    component="img"
                                    src="/images/general/maldives/three_img_nobkgrd.png"
                                    alt="Maldives adaptation measures"
                                    sx={{
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: 2,
                                        boxShadow: 3,
                                        mt: 1,
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        fontStyle: 'italic',
                                        fontSize: '0.75rem',
                                        color: 'text.secondary',
                                        textAlign: 'center',
                                        mt: 1,
                                        mb: 0.5
                                    }}
                                >
                                    From artificial islands to sand infill and coastal sandbags, the Maldives is engineering its survival against rising seas.
                                </Typography>
                            </Box> 
                             This means the Maldives has virtually no buffer against ocean rise. Already, some uninhabited sandbanks have vanished. Erosion eats away at beaches on
                            inhabited islands, forcing communities to pile sandbags or use sand-pumping machines to bolster the shore. Nearly a third of Maldivians live in the capital city Malé, which is essentially a concrete island
                            completely surrounded by a seawall. That seawall protects Malé (for now), but many smaller islands lack such defenses.
                        </Typography>

                        <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                            The entire nation could be submerged or rendered unlivable if seas rise significantly – a haunting possibility the Maldives’ government has been vocal about. They often say the Maldives are the canary in the coal mine
                            for climate change. On the flip side, because the country is small (pop. ~540,000) and relatively well-off per capita, it’s been exploring bold adaptation measures – like building artificial high islands and even
                            a floating city. Still, the Maldives’ vulnerability is existential. When we talk about 1 meter of sea-level rise, for Maldives that could literally mean losing 80% of its land area.
                        </Typography>
                    </Box>
                    

                    <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 2, color: 'text.secondary' }}>
                        PHILIPPINES
                    </Typography>
                                
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                             An archipelago of 7,600+ islands, the Philippines has a diverse geography – some towering mountains, some low coral islands, and many densely populated coastal plains. It’s one of the most disaster-prone
                            countries in the world due to its location in the Pacific typhoon belt and the Pacific “Ring of Fire” (volcanoes and earthquakes).
                        </Typography>
                        <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                            The Philippines often tops lists for climate risk because of its exposure
                            to strong typhoons. Typhoon Haiyan (Yolanda) in 2013 was a wake-up call: it generated storm surges up to 6 meters (20 feet) high, devastating the city of Tacloban and killing over 6,300 people.
                        <Box sx={{ float: 'left', mr: 3, my: 1, width: { xs: '100%', md: 420 } }}>
                            <Box
                                component="img"
                                src="/images/general/philippines/typhoon_haiyan.png"
                                alt="Maldives adaptation measures"
                                sx={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: 2,
                                    boxShadow: 3,
                                    mt: 1
                                }}
                            />
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    textAlign: 'center',
                                    fontStyle: 'italic',
                                    fontSize: '0.75rem',
                                    color: 'text.secondary',
                                    mt: 1,
                                    mb: 0.5
                                }}
                            >
                                Devastation in Tacloban after Typhoon Haiyan’s 6-meter storm surge in 2013 — one of the deadliest climate-fueled disasters in Philippine history (Gaurdian, 2013).
                            </Typography>   
                        </Box>
                            The storm surge aspect ties into sea-level rise – higher baseline sea levels make tsunami-like storm surges reach further. 
                            The Philippines also grapples with regular floods (from monsoon rains) and landslides in hill areas when rains are heavy. Manila, its capital region (metro pop ~13 million), 
                            is a coastal megacity facing Manila Bay. Parts of Manila are sinking due to groundwater pumping, even as seas rise – a doubly
                            alarming combo.  Major infrastructure like Manila’s ports, airports, and many residential areas are at or near sea level. Beyond Manila, other big cities like Cebu and Davao are on the coast too. 
                            The country’s long coastline (over 36,000 km) means hundreds of towns are exposed to coastal erosion and flooding. Coral reefs and mangroves that used to shield shores have been 
                            degraded in many areas by development or pollution, increasing vulnerability.
                        </Typography>
                        <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                            On top of that, poverty in some regions makes recovery from disasters very hard, stretching coping capacity. So, the Philippines’ snapshot: high exposure to extreme storms,
                            lots of people in coastal hazard zones, and challenges with protecting everyone. It’s ranked among the top 5 most climate-affected countries over the past two decades.
                            Despite these differences, all three places share a sobering reality: a huge number of people and critical assets (homes, roads, farms, resorts) are located in areas that climate change is turning from safe to risky.
                            Their situations range from Bangladesh’s massive low delta, to Maldives’ tiny atolls, to the Philippines’ scattered islands – but each is a case study in the urgency of climate adaptation.
                        </Typography>
                    </Box>
                
                    <Box sx={{ width: '100%', my: 3 }}>
                        <RegionMap />
                    </Box>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        This interactive map lets you explore climate vulnerability across Bangladesh, the Maldives, and the Philippines.
                        Each layer highlights how risks related to flooding, sea-level rise, and heat affect these countries differently,
                        and how population exposure is evolving. It’s a tool for understanding both the scale and specificity of adaptation challenges.
                    </Typography>
                </NarrativeContainer>
            </motion.section>

            {/* Section 4: Migrationm & Displacement */}
            <motion.section
                id="migrationDisplacement"
                style={{ scrollSnapAlign: 'start' }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: 0.15 }}
                variants={sectionVariants}
            >
                <NarrativeContainer>
                    <Typography variant="h3" gutterBottom sx={{ mt: 6, mb: 2, color: 'text.primary' }}>
                        MIGRATION, DISPLACEMENT, AND ADAPTATION
                    </Typography>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        Faced with these threats, people and governments are responding in two main ways: some are moving out of harm’s way, and
                        others are investing in defenses to stay put. Often it’s a combination of both. Let’s look at what’s happening:
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                            Climate-driven displacement is already underway. In Bangladesh’s coastal Khulna region, farmland ruined by saltwater has
                            pushed villagers toward Dhaka and other cities. An estimated 400,000 Bangladeshis are displaced by riverbank erosion and flooding each year.
                            In 2019 alone, over 4 million were internally displaced by climate disasters. The Philippines sees major storm-triggered evacuations—Typhoon
                            Haiyan displaced over 4 million in 2013. In the Maldives, the government has relocated residents from highly vulnerable islands like
                            Kandholhudhoo to larger, safer ones.
                        </Typography>
                        <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                            

                        <Box sx={{ float: 'left', mr: 3, my: 1, width: { xs: '100%', md: 420 } }}>
                            <Box
                                component="img"
                                src="/images/general/bangladesh/cyclone_shelter.png"
                                alt="Cyclone Shelter in Bangladesh"
                                sx={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: 2,
                                    boxShadow: 3,
                                    mt: 1
                                }}
                            />
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    textAlign: 'center',
                                    fontStyle: 'italic',
                                    fontSize: '0.75rem',
                                    color: 'text.secondary',
                                    mt: 1,
                                    mb: 0.5
                                }}
                            >
                                Cyclone shelters in Bangladesh are designed to protect communities from storm surges and flooding, but they also serve as evacuation centers during disasters (© Climate Visuals).
                            </Typography>   
                        </Box>    
                            But migration is rarely due to climate alone. Often, it’s the final push amid other pressures—economic hardship, lack of services,
                            or family ties. And for many, displacement means moving from one risky zone to another, such as urban slums in flood-prone cities like Dhaka.
                            Adaptation, therefore, isn’t just physical—it requires social and policy systems to support safe, dignified resettlement.
                    </Typography>
                    </Box>

                        <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                            On the adaptation side, all three countries are innovating. Bangladesh has built thousands of cyclone shelters and hundreds
                            of kilometers of embankments. It’s replanting mangroves and investing in water management through its Delta Plan 2100. The Maldives
                            is building “safe islands” and experimenting with floating cities like Hulhumalé, while maintaining a 3-meter seawall around Malé.
                            The Philippines is modernizing flood controls in Manila, restoring mangroves, and elevating houses on stilts in vulnerable towns.
                        </Typography>

                        <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                            Despite these efforts, adaptation often lags behind risk. In some places, people return to unsafe areas due to a lack of alternatives.
                            Scaling up is the challenge. But the gains are real: cyclone fatalities in Bangladesh have dropped 100-fold, and communities across all
                            three countries are showing how ingenuity and preparedness can save lives—even as the waters rise.
                        </Typography>

                        <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                            As floods grow more severe, the pressure to relocate grows stronger. The interactive map below tracks this shift in flood intensity across years —
                            particularly in Bangladesh and the Philippines — reinforcing how environmental pressures are driving climate-linked migration.
                        </Typography>

                        <Box sx={{ width: '100%', my: 4 }}>
                            <FloodSeverityMap />
                        </Box>

                        <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                            With each passing year, flood impacts are growing more acute. But relocation isn’t just a matter of logistics — it’s a question of identity, culture,
                            and dignity. Some Maldivians have said, “We don’t want to become climate refugees – we’d rather fight to save our country.” In Bangladesh, coastal
                            communities are deeply rooted to ancestral land and graveyards. For many, leaving isn’t just moving — it’s losing a way of life.  Policymakers must recognize that climate relocation is an ethical challenge, not just a technical one. Communities must be empowered with voice and choice,
                            and supported with real alternatives. Without that, we risk solving displacement with more displacement — moving people out of danger only to
                            place them into precarity.
                        </Typography>
                    </NarrativeContainer>
            </motion.section>

            {/* Section 4.5: Strategic Overlays */}
            <motion.section
                id="urbanization"
                style={{ scrollSnapAlign: 'start' }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: 0.15 }}
                variants={sectionVariants}
            >
                <NarrativeContainer>
                    <Typography variant="h3" gutterBottom align="left" sx={{ mb: 6, mt: 0, color: 'text.primary' }}>
                        URBANIZATION AT THE EDGE
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        South and Costal Asia’s urban centers are growing rapidly — but many of them are growing in the wrong places.
                        In Bangladesh, the Maldives, and the Philippines, population growth and rural displacement are funneling people
                        toward coastal cities that are increasingly exposed to climate threats. Lets take a closer look at the data:
                    </Typography>

                    <Box sx={{ width: '100%', my: 3 }}>
                        <PopulationChoroplethMap />
                    </Box>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        This interactive map shows the distribution of urban populations across Bangladesh, the Maldives, and the Philippines.
                        Each circle represents a city, sized by its population. The visualization highlights how many of the region’s fastest-growing cities
                        are located in coastal zones that are increasingly at risk — places where infrastructure must be climate-ready, or else climate-vulnerable.
                    </Typography>
                
                    <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 2, color: 'text.secondary' }}>
                        DHAKA, BANGLADESH
                    </Typography>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        <strong>Dhaka</strong>, for instance, is expanding into floodplains and wetlands, turning natural buffers into concrete blocks.
                        With millions migrating from coastal zones, the city’s slums have swelled — yet these new homes often sit in
                        flood-prone areas with poor drainage. The result? A climate feedback loop: climate impacts displace people, who
                        then settle in zones vulnerable to the next disaster.
                    </Typography>

                    <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 2, color: 'text.secondary' }}>
                        MANILA, PHILIPPINES
                    </Typography>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        <strong>Manila</strong>, in the Philippines, faces similar pressures. As the metro area sprawls into reclaimed land and low-lying
                        coastlines, the risk from typhoons and storm surges intensifies. Coastal megacities like Manila are especially at
                        risk not just from the sea, but from land subsidence — parts of the city are sinking, even as seas rise.
                    </Typography>

                    <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 2, color: 'text.secondary' }}>
                        HULHUMALÉ, MALDIVES
                    </Typography>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        <strong>In the Maldives</strong>, urbanization takes a unique form: the creation of artificial islands like Hulhumalé.
                        This engineered expansion is part adaptation, part necessity — a bold attempt to accommodate population growth while sidestepping
                        the limits of natural land. But even these futuristic cities are not immune to climate forces.
                    </Typography>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        In all three nations, the challenge is the same: how to urbanize safely, equitably, and with climate resilience in mind.
                        Urban planning that ignores elevation, drainage, and green buffers risks amplifying the crisis. The window to shape coastal
                        cities into climate-ready hubs is narrow — but still open.
                    </Typography>

                    <Box sx={{ width: '100%', my: 3 }}>
                        <PopulationAtRiskChart />
                    </Box>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        This above interactive chart displays how the number of people living in high-risk zones has grown over time. 
                        In many cities, population exposure is increasing — not just due to natural hazard trends, but due to urban development in flood-prone areas. 
                        This visual reinforces the urgent need to align population policy with climate adaptation planning.
                    </Typography>

                    <Paper
                        elevation={2}
                        sx={{
                            p: 2,
                            mt: 3,
                            mb: 2,
                            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
                            borderLeft: theme => `6px solid ${theme.palette.primary.main}`,
                            color: 'theme.palette.secondary.main,'
                        }}
                    >
                        <Typography variant="body1" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                            Climate change isn't just melting ice caps — it's erasing cities.
                        </Typography>
                    </Paper>
                </NarrativeContainer>
            </motion.section>

            {/* Section 4.6: Tactical & Symbolic Timing */}
            <motion.section
              id="dataInsights"
              style={{ scrollSnapAlign: 'start' }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: 0.15 }}
              variants={sectionVariants}
            >
              <NarrativeContainer>
                <Typography variant="h3" gutterBottom align="left" sx={{ mt: 6, mb: 2, color: 'text.primary' }}>
                  DATA-DRIVEN INSIGHTS AND TEMPORAL CAUSALITY
                </Typography>

                <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                  Our analysis goes beyond static snapshots — it examines how climate stressors and social outcomes interact over time.
                  Through both static correlations and rolling lead-lag analyses, we explored how variables like sea-level rise and high-tide flood
                  days relate to population dynamics, urban growth, and migration.
                </Typography>

                <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 2, color: 'text.secondary' }}>
                  CORRELATION VS. CAUSATION
                </Typography>

                <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                  We observed that in Bangladesh, sea-level rise often precedes increased net migration with a lag of 1–3 years. This suggests a temporal
                  link — but correlation is not causation. Migration is multifactorial: climate is one influence among many, including economic pressure,
                  infrastructure failure, and pre-existing mobility patterns. However, these trends signal the importance of early climate warnings for planning
                  displacement responses.
                </Typography>

                <Box sx={{ width: '100%', my: 3 }}>
                  <LaggedCorrelationChart />
                </Box>

                <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                  This visualization allows users to explore correlations at different lags between climate variables (e.g. sea level rise, precipitation)
                  and socioeconomic responses (e.g. migration, GDP). You can adjust the time lag to explore how the strength and direction of correlations change —
                  helping reveal potential lead-lag dynamics in climate impacts.
                </Typography>

                <Box sx={{ width: '100%', my: 3 }}>
                  <LeadLagCorrelationHeatmap />
                </Box>

                <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                  The heatmap expands this approach, surfacing broad relationships across many variable pairs. For instance, we found that high-tide flood days
                  in Bangladesh are negatively correlated with net migration, particularly in lagged windows — suggesting people may leave after chronic flooding
                  worsens. On the other hand, urban growth metrics often show positive lagged correlations, especially in the Philippines, where rebuilding or
                  informal expansion follows disaster shocks.
                </Typography>

                <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                  These tools do not prove causality, but they help policymakers and researchers prioritize deeper investigation. Rolling correlations
                  and cross-correlation analysis offer crucial insight into timing: when climate stress becomes migration pressure, and when proactive
                  adaptation could interrupt harmful feedback loops.
                </Typography>
              </NarrativeContainer>
            </motion.section>

            {/* Section 5: Holidays, Seasonality & Severity */}
            <motion.section
                id="limitations"
                style={{ scrollSnapAlign: 'start' }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.15 }}
                variants={sectionVariants}
            >
                <NarrativeContainer>
                    <Typography
                        variant="h3"
                        gutterBottom
                        align="left"
                        sx={{ mb: 2, mt: 6, color: 'text.primary' }}
                    >
                        DATA LIMITATIONS & CAUTIONS
                    </Typography>

                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        Climate projections are not crystal balls. For example, estimates that up to 20 million Bangladeshis could be displaced by 2050 due to sea-level rise depend heavily
                        on assumptions about emissions and adaptation. If global greenhouse gas emissions drop significantly and coastal protections are strengthened, the number could be far
                        lower. If not, it could be higher. These projections are not fate — they’re scenarios meant to guide urgent planning, not passive resignation.
                    </Typography>


                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        But accurate planning depends on robust data — and gaps remain. For instance, flood day records were not available for the Maldives in our dataset. That doesn't mean
                        flooding isn’t happening — it is. But data blind spots, especially in small island or lower-income nations, can mask real risks. Expanding monitoring systems like tide
                        gauges and displacement tracking will be critical to improving early warning systems and targeting adaptation funding.
                    </Typography>


                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        There’s also a risk of “data bias.” Most climate maps prioritize high-value urban centers because of the economic losses at stake. But rural and low-income communities —
                        which often lack infrastructure and safety nets — may be equally or more vulnerable, even if they don’t show up on a heatmap. Equity must be central to adaptation:
                        a seawall protecting a financial district might be justified, but raising homes in a flood-prone village could save more lives per dollar. The people most at risk are often those
                        least responsible for the emissions causing the crisis.
                    </Typography>
                </NarrativeContainer>
            </motion.section>

            {/* Section 6: Conclusion & Recommendations */}
            <motion.section
                id="conclusion"
                style={{ scrollSnapAlign: 'start' }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.15 }}
                variants={sectionVariants}
            >
                <NarrativeContainer>
                    <Typography
                        variant="h3"
                        gutterBottom
                        align="left"
                        sx={{ mb: 2, mt: 6, color: 'text.primary' }} // Adds a bit of space between h4 and the paragraphs
                    >
                        CONCLUSION AND RECOMMENDATIONS
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        We must strike a balance in messaging. It’s easy to get lost in doom – endless stats about loss. It’s also possible to be too optimistic – assuming magical technologies will fix everything.
                        The reality is in between: these countries can survive and even thrive under climate change, but it will require hard work, money, innovation, and yes, some difficult transformations.
                        The reason Bangladesh, the Maldives, and the Philippines keep raising their voices in climate forums is not to admit defeat, but to call for solidarity and action while there’s still
                        time to make a difference. They remind the world that we’re all in this together. A flood in Bangladesh can eventually have ripple effects elsewhere (through migration or economic impacts),
                        just as emissions from faraway industries affect the seas lapping at Maldivian shores.
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                        In conclusion, the data and research give us a clearer picture of the challenges, and even some predictive power to anticipate problems. But we must use this knowledge responsibly.
                        That means involving communities in solutions, prioritizing equity, and remembering that behind every data point is a human story. As one young climate activist in the Maldives said,
                        “We are not just statistics. We are people who love our country and want to save it.” Data can guide us, but human values and cooperation will determine whether the vulnerable can adapt and overcome.
                        The next few decades will test our collective willingness to heed these warnings and act – not only for South Asia’s coastal communities, but for coastal cities and small islands worldwide
                        that face a similar future. The time to build resilience is now, and the opportunity to do so fairly and effectively is one we cannot afford to miss.
                    </Typography>
                </NarrativeContainer>
            </motion.section>

            {/* Section 7: Acknowledgments & Data Handling */}
            <motion.section
                id="acknowledgments"
                style={{ scrollSnapAlign: 'start' }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.15 }}
                variants={sectionVariants}
            >
            <NarrativeContainer>
                <Typography
                    variant="h3"
                    gutterBottom
                    align="left"
                    sx={{ mb: 2, mt: 6, color: 'text.primary' }} // Adds a bit of space between h4 and the paragraphs
                >
                    ACKNOWLEDGMENTS AND DATA HANDLING
                </Typography>

                <Typography variant="h4 " gutterBottom sx={{ mt: 2, mb: 3, color: 'text.secondary' }}>
                    DATA SOURCE COMNMENTARY
                </Typography>

                <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                    The datafile is publicly available and can be downloaded <a href="/data/processed_full_country.json" target="_blank" rel="noopener noreferrer"><strong>here</strong></a>.
                </Typography>

                <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                    To enhance the range and analytical depth of this data, we cross-referenced additional sources,
                    including:
                    <ul>
                        <li>
                            World Bank Open Data <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer">
                                Financial and Economic Temporal Data</a> for economic context and cross reference calculations.
                        </li>
                        <li>
                            The <a href="https://hub.worldpop.org/doi/10.5258/SOTON/WP00693" target="_blank" rel="noopener noreferrer">
                                WorldPop</a> and <a href="https://human-settlement.emergency.copernicus.eu/ghs_stat_ucdb2015mt_r2019a.php?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer">
                                Copernicus GHS settlement grids</a> to assess urbanization and population density.
                        </li>
                        <li>
                            Key media investigations to validate high-impact cases:
                            <ul>
                                <li>
                                    <a href="https://www.gfdrr.org/en/publication/flood-risk-management-dhaka" target="_blank" rel="noopener noreferrer">
                                        Dhaka is also among the most climate-vulnerable megacities in the world. As the city urbanizes, water-related hazards continue to increase (2015) </a>
                                </li>
                                <li>
                                    <a href="https://www.reuters.com/markets/asia/typhoon-gaemi-forces-philippines-halt-work-market-trading-2024-07-24/" target="_blank" rel="noopener noreferrer">
                                        The Philippines sees an average of 20 tropical storms annually, causing floods and deadly landslides (2024)</a>
                                </li>
                                <li>
                                    <a href="https://www.nature.com/immersive/d41586-024-01157-7/index.html" target="_blank" rel="noopener noreferrer">
                                        With 80% of its land less than one metre above sea level, some scientists predict that the islands could be completely submerged by 2100 (2024)</a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </Typography>

                <Typography variant="h3 " gutterBottom sx={{ mt: 2, mb: 3, color: 'text.secondary' }}>
                    WANT A CLOSER LOOK AT THE DATA? 
                </Typography>

                <Typography variant="body1" paragraph sx={{ mb: 3, textAlign: 'justify' }}>
                    For those interested in diving deeper, our full methodology and exploratory analysis are available:
                    <br />
                    – View the full <a href="/Climate_Vulnerability_Analysis.pdf" target="_blank" rel="noopener noreferrer"><strong>EDA report & Methodology walkthrough</strong></a>
                    <br />
                    – View the Corresponding Research Paper <a href="/DSAN5200_FinalPaper.pdf" target="_blank" rel="noopener noreferrer"></a>
                    <br />
                    – Browse the complete <a href="/gallerygrid" target="_blank" rel="noopener noreferrer"><strong>visualization gallery</strong></a>
                </Typography>
            </NarrativeContainer>
        </motion.section>
        </>
    );
};

export default Scrollytelling;