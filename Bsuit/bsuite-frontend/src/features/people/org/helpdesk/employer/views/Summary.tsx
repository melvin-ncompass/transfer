import { Typography, useTheme } from "@mui/material";
import { Box, Stack } from "@mui/system";
import StatCardAtom from "../../../../../../components/atom/quote/Quote";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { DateRangePicker } from "../../../../../../components/atom/custom-date-range-picker";
import { BarChart, LineChart } from "@mui/x-charts";
import ScrollAnimatedChart from "../../../../../../components/charts/scrollAnimatedChart/ScrollAnimatedChart";

function Summary() {
  // hooks
  const theme = useTheme();
  const margin = { right: 24 };

  const uData = [4000, 3000, 2000, 2780, 1890, 2390, 3490];
  const pData = [2400, 1398, 9800, 3908, 4800, 3800, 4300];
  const xLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

  const ldata = [4000, 3000, 2000, 2780, 1890, 2390, 3490];
  const mdata = [2400, 1398, 9800, 3908, 4800, 3800, 4300];
  const xBarLabels = [
    "Page A",
    "Page B",
    "Page C",
    "Page D",
    "Page E",
    "Page F",
    "Page G",
  ];

  return (
    <Box height={"85%"} overflow={"scroll"}>
      {/* Helpdesk Dashboard */}

      <Typography>Helpdesk Dashboard</Typography>
      <Stack direction={"row"} gap={1}>
        <StatCardAtom barColor="#fa5f5e" width="25%">
          <Stack
            direction={"row"}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={"100%"}
            gap={1}
            p={1}
          >
            <Stack flex={1}>
              <Typography variant="subtitle2">Open</Typography>
              <Typography variant="subtitle2">135</Typography>
            </Stack>
          </Stack>
        </StatCardAtom>
        <StatCardAtom barColor="#c2b89d" width="25%">
          <Stack
            direction={"row"}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={"100%"}
            gap={1}
            p={1}
          >
            <Stack flex={1}>
              <Typography variant="subtitle2">Incoming Today</Typography>
              <Typography variant="subtitle2">10</Typography>
            </Stack>
            <Stack flex={1}>
              <Typography textAlign={"right"} variant="subtitle2">
                From Yesterday
              </Typography>
              <Typography textAlign={"right"} variant="subtitle2">
                2{" "}
              </Typography>
            </Stack>
          </Stack>
        </StatCardAtom>
        <StatCardAtom barColor="#cb7cc0" width="25%">
          <Stack
            direction={"row"}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={"100%"}
            gap={1}
            p={1}
          >
            <Stack flex={1}>
              <Typography variant="subtitle2">Closed Today</Typography>
              <Typography variant="subtitle2">0</Typography>
            </Stack>
            <Stack flex={1}>
              <Typography textAlign={"right"} variant="subtitle2">
                From Yesterday
              </Typography>
              <Typography textAlign={"right"} variant="subtitle2">
                2{" "}
              </Typography>
            </Stack>
          </Stack>
        </StatCardAtom>
        <StatCardAtom barColor="#dfe2e6" width="25%">
          <Stack
            direction={"row"}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={"100%"}
            gap={1}
            p={1}
          >
            <Stack flex={1}>
              <Typography variant="subtitle2">On Hold</Typography>
              <Typography variant="subtitle2">0</Typography>
            </Stack>
          </Stack>
        </StatCardAtom>
      </Stack>

      {/* Ticket Analysis */}

      <Box
        display={"flex"}
        alignItems="center"
        width="100%"
        gap={2} // spacing between children
        justifyContent={"space-between"}
        my={2}
      >
        <Typography>Ticket Analysis</Typography>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          justifyContent={"space-between"}
          width={"40%"}
        >
          <SingleSelectElement
            label="Category"
            value={""}
            onChange={(value: string) => {}}
            options={[]}
            sx={{ width: "50%" }}
          />

          <DateRangePicker width={"50%"} />
        </Box>
      </Box>
      <Stack direction={"row"} gap={1}>
        <StatCardAtom barColor="#fa5f5e" width="25%">
          <Stack
            direction={"row"}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={"100%"}
            gap={1}
            p={1}
          >
            <Stack flex={1}>
              <Typography variant="subtitle2">Open</Typography>
              <Typography variant="subtitle2">135</Typography>
            </Stack>
          </Stack>
        </StatCardAtom>
        <StatCardAtom barColor="#c2b89d" width="25%">
          <Stack
            direction={"row"}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={"100%"}
            gap={1}
            p={1}
          >
            <Stack flex={1}>
              <Typography variant="subtitle2">Incoming Today</Typography>
              <Typography variant="subtitle2">10</Typography>
            </Stack>
            <Stack flex={1}>
              <Typography textAlign={"right"} variant="subtitle2">
                From Yesterday
              </Typography>
              <Typography textAlign={"right"} variant="subtitle2">
                2{" "}
              </Typography>
            </Stack>
          </Stack>
        </StatCardAtom>
        <StatCardAtom barColor="#cb7cc0" width="25%">
          <Stack
            direction={"row"}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={"100%"}
            gap={1}
            p={1}
          >
            <Stack flex={1}>
              <Typography variant="subtitle2">Closed Today</Typography>
              <Typography variant="subtitle2">0</Typography>
            </Stack>
            <Stack flex={1}>
              <Typography textAlign={"right"} variant="subtitle2">
                From Yesterday
              </Typography>
              <Typography textAlign={"right"} variant="subtitle2">
                2{" "}
              </Typography>
            </Stack>
          </Stack>
        </StatCardAtom>
        <StatCardAtom barColor="#dfe2e6" width="25%">
          <Stack
            direction={"row"}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={"100%"}
            gap={1}
            p={1}
          >
            <Stack flex={1}>
              <Typography variant="subtitle2">On Hold</Typography>
              <Typography variant="subtitle2">0</Typography>
            </Stack>
          </Stack>
        </StatCardAtom>
      </Stack>
      {/* Total Open vs Closed Tickets  */}

      <Typography>Total Open vs Closed Tickets</Typography>
      {/* 
        data :
        array of open (number[])
        array of closed(number[])
        array of months (string[])
        length of all three is to be same 

      */}
      <ScrollAnimatedChart>
        <LineChart
          series={[
            {
              data: pData,
              label: "Total Open Tickets",
              color: theme.palette.warning.dark,
            },
            {
              data: uData,
              label: "Total Closed Tickets",
              color: theme.palette.error.main,
            },
          ]}
          xAxis={[{ scaleType: "point", data: xLabels, height: 28 }]}
          yAxis={[{ width: 50 }]}
          margin={margin}
        />
      </ScrollAnimatedChart>
      <Typography>Top Category-wise Open Tickets</Typography>

      <Box width={"100%"} display={"flex"}>
        <ScrollAnimatedChart>
          <BarChart
            series={[
              { data: ldata, label: "lv", id: "pvId", stack: "total" },
              { data: mdata, label: "mv", id: "uvId", stack: "total" },
              { data: mdata, label: "mv", id: "uvId2", stack: "total" },
            ]}
            xAxis={[{ data: xBarLabels, height: 28 }]}
            yAxis={[{ width: 50, label: "Number of Open Tickets" }]}
          />
        </ScrollAnimatedChart>
        <Box width={"50%"} display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
          {xBarLabels.map((label, index) => {
            const total =
              (ldata[index] || 0) + (mdata[index] || 0) + (mdata[index] || 0); // because you used mdata twice in chart

            return (
              <Box
                key={label}
                width="100%"
                bgcolor={theme.palette.grey[300]}
                height="80px"
                display="flex"
                justifyContent="center"
                flexDirection="column"
                p={1}
                borderRadius={1}
              >
                <Typography variant="subtitle2">{label}</Typography>
                <Typography variant="body1">{total}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
      <Typography>Category-wise First Response (in hrs)</Typography>

      <ScrollAnimatedChart>
        <BarChart
          series={[{ data: ldata, label: "lv", id: "pvId", stack: "total" }]}
          xAxis={[{ data: xBarLabels, height: 28 }]}
          yAxis={[{ width: 50, label: "Number of Open Tickets" }]}
        />
      </ScrollAnimatedChart>
      <Typography>Category-wise Resolution Time (in hrs)</Typography>

      <ScrollAnimatedChart>
        <BarChart
          series={[{ data: ldata, label: "lv", id: "pvId", stack: "total" }]}
          xAxis={[{ data: xBarLabels, height: 28 }]}
          yAxis={[{ width: 50, label: "Number of Open Tickets" }]}
        />
      </ScrollAnimatedChart>
      <Typography>CSAT Trend</Typography>

      <ScrollAnimatedChart>
        <LineChart
          series={[
            {
              data: pData,
              label: "Total Open Tickets",
              color: theme.palette.warning.dark,
            },
          ]}
          xAxis={[{ scaleType: "point", data: xLabels, height: 28 }]}
          yAxis={[{ width: 50 }]}
          margin={margin}
        />
      </ScrollAnimatedChart>
    </Box>
  );
}

export default Summary;
