import { Box, Typography, Card, CardContent, Divider, List, ListItem, ListItemText } from '@mui/material';
import { helpPageStyles } from '../styles/pages/help.styles';

// ----------------------------------------------------------------------

/**
 * Help Page
 * 
 * Placeholder page for help and documentation.
 */
export default function HelpPage() {
  return (
    <Box sx={helpPageStyles.container}>
      <Box sx={helpPageStyles.header}>
        <Typography variant="h4" component="h1" sx={helpPageStyles.title}>
          Help & Documentation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Resources for using the CxH Pulse platform
        </Typography>
      </Box>

      <Card>
        <CardContent sx={helpPageStyles.cardContent}>
          <Box sx={helpPageStyles.contentWrapper}>
            <Box>
              <Typography variant="subtitle2" component="h3" sx={helpPageStyles.sectionTitle}>
                Getting Started
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The CxH Pulse platform integrates climate data (ERA5), health indicators (KHIS2),
                and conversational insights (PROMPTS) to forecast maternal health risks in Kajiado County.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" component="h3" sx={helpPageStyles.sectionTitle}>
                Data Sources
              </Typography>
              <List dense sx={helpPageStyles.list}>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        <strong>KHIS2:</strong> Monthly health indicators (Jan 2022 - Sep 2025)
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        <strong>PROMPTS:</strong> Daily conversational data from pregnant women
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        <strong>ERA5:</strong> Climate reanalysis - temperature, precipitation, humidity
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        <strong>Master Facility List:</strong> Health facility locations and capacity
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="subtitle2" component="h3" sx={helpPageStyles.sectionTitle}>
                Using the Dashboard
              </Typography>
              <List dense sx={helpPageStyles.list}>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        Select a geographic region (county, sub-county, or ward)
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        Choose a health indicator to analyze
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        View correlation charts showing relationships with temperature and precipitation
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        Click on wards in the map to view detailed forecasts
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="subtitle2" component="h3" sx={helpPageStyles.sectionTitle}>
                Interpreting Correlation Charts
              </Typography>
              <List dense sx={helpPageStyles.list}>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        <strong>Scatter points:</strong> Represent observed data at monthly intervals
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        <strong>Trend line:</strong> Shows the overall relationship between climate and health indicators
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        <strong>R² value:</strong> Indicates strength of correlation (0-1, higher is stronger)
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        <strong>Danger zones:</strong> Red reference lines mark risk thresholds
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="subtitle2" component="h3" sx={helpPageStyles.sectionTitle}>
                Understanding Forecasts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={helpPageStyles.forecastDescription}>
                Ward-level forecasts provide 12-month predictions based on historical climate-health correlations. These are demonstration models designed to show the potential of multi-sectoral data integration.
              </Typography>
              <List dense sx={helpPageStyles.list}>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        <strong>Forecasts combine temperature and precipitation projections with historical health patterns</strong>
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        <strong>Danger zone alerts indicate when thresholds are expected to be exceeded</strong>
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={helpPageStyles.listItem}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        <strong>Use forecasts for resource planning and early intervention strategies</strong>
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="subtitle2" component="h3" sx={helpPageStyles.sectionTitle}>
                Key Use Cases
              </Typography>
              <Box sx={helpPageStyles.useCasesWrapper}>
                <Box>
                  <Typography variant="body2" sx={helpPageStyles.useCaseTitle}>
                    Heat Exposure Monitoring
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detect maternal distress during heat spells by correlating PROMPTS conversation data with temperature extremes. Use for targeted SMS guidance and clinic hour adjustments.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={helpPageStyles.useCaseTitle}>
                    Infectious Disease Surveillance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Anticipate malaria surges by analyzing rainfall patterns. Coordinate antimalarial medicine stocking and vector control interventions 2-3 weeks before expected outbreaks.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={helpPageStyles.useCaseTitle}>
                    Resource Planning
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Align facility readiness (drug stocks, staffing) with predicted climate-health risks to reduce referral delays and stock-outs.
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" component="h3" sx={helpPageStyles.sectionTitle}>
                Data Table & Export
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use the Data Table view to access ward-level aggregated data with sorting and filtering. Export to CSV for offline analysis, report generation, or integration with other tools.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" component="h3" sx={helpPageStyles.sectionTitle}>
                Configuring Thresholds
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visit the Settings page to adjust danger zone thresholds for temperature and precipitation. These thresholds determine when alerts are triggered and should be set in collaboration with County MoH based on local context.
              </Typography>
            </Box>

            <Divider sx={helpPageStyles.divider} />
            <Box sx={helpPageStyles.supportSection}>
              <Typography variant="body2" sx={helpPageStyles.supportTitle}>
                Technical Support
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Email: datakind@example.com
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Platform Version: 0.1 (4-Week Sprint Prototype)
              </Typography>
            </Box>

            <Divider sx={helpPageStyles.divider} />
            <Box>
              <Typography variant="body2" sx={helpPageStyles.aboutTitle}>
                About CxH Pulse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                A collaboration between DataKind, Spectrum Africa, and Jacaranda Health to demonstrate the potential of integrated climate-health monitoring for maternal health outcomes in Kajiado County, Kenya.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
