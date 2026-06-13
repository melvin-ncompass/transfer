import { useInView } from "react-intersection-observer";
import { Box } from "@mui/material";

interface ScrollAnimatedChartProps {
  children: React.ReactNode; // The chart component to render
  threshold?: number;        // How much needs to be visible to trigger
}

const ScrollAnimatedChart = ({ children, threshold = 0.5}: ScrollAnimatedChartProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold,
  });

  return (
    <Box ref={ref} width="100%" overflow="hidden" height={400}>
      {inView && children}
    </Box>
  );
};

export default ScrollAnimatedChart;