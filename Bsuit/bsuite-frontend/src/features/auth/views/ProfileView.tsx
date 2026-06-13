import React, { useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

// project imports
import Profile from '../Profile/Profile';
import Security from '../Profile/Security';
import Sessions from '../Profile/Sessions';
import ProfileModals from '../../auth/profilePage/components/ModalsAndSnackbars';
import { useGetDetailsQuery } from '../../auth/api/profile.api';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../store/store';
import { setPfp, setSessions, setDisplayName, setProfileEmail, setTwoFA, setPrevDisplayName, setPasswordProp } from '../../auth/profilePage/profileSlice';
import { set } from 'lodash-es';
import { TabsAtom } from '../../../components/tabs';

// ==============================|| PROFILE 3 ||============================== //

export default function Profile3() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const { data: detailsResp, error, isLoading, isError } = useGetDetailsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    if (detailsResp) {
      const d = detailsResp.data;
      dispatch(setPfp(d.profilePicUrl ?? ""));
      dispatch(setPasswordProp(d.password));
      dispatch(setSessions(d.sessions));
      dispatch(setDisplayName(d.displayName));
      dispatch(setProfileEmail(d.email));
      dispatch(setTwoFA(d.twoFAEnabled));
      dispatch(setPrevDisplayName(d.displayName));
    } else if (isError) {
      if (typeof error === "object" && error !== null && "status" in error) {
        const status = (error as { status: number }).status;
        if (status == 401) {
          navigate("/login");
        } else {
          throw error;
        }
      }
    }
  }, [detailsResp, isError, error, navigate, dispatch]);

  const tabs = [
    {
      label: 'Profile',
      content: <Profile />,
    },
    {
      label: 'Security',
      content: <Security />,
    },
    {
      label: 'Sessions',
      content: <Sessions />,
    },
  ];

  return (
    <Card sx={{p:0 ,  height: "calc(100vh - 140px)",}} >
      {/* <CardHeader sx={{ p:1  }}/> */}
      <CardContent sx={{ p: 0 }}>
        <TabsAtom
          tabs={tabs}
          value={value}
          onChange={setValue}
          sx={{pl:2 , pt:2}}
        />
        <ProfileModals />
      </CardContent>
    </Card>
  );
}
