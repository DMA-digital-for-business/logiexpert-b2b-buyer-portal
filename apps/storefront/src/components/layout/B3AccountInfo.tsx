import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { Box, Button, Tooltip } from '@mui/material';

import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';

import B3DropDown, { ListItemProps } from '../B3DropDown';

interface ListProps {
  [key: string]: string;
}

const list: Array<ListProps> = [
  {
    name: 'Log out',
    key: 'logout',
    idLang: 'global.button.logout',
  },
];

const BUYING_GUIDE_URL = 'https://www.logiexpert.com/guida-acquisto';

export function BuyingGuideButton() {
  const b3Lang = useB3Lang();

  return (
    <Tooltip title={b3Lang('global.B3AccountInfo.buyingGuide')}>
      <Button
        aria-label={b3Lang('global.B3AccountInfo.buyingGuide')}
        component="a"
        className="buying-guide-button"
        href={BUYING_GUIDE_URL}
        rel="noopener noreferrer"
        size="small"
        endIcon={<OpenInNewIcon fontSize="small" />}
        variant="outlined"
        target="_blank"
      >
        {b3Lang('global.B3AccountInfo.buyingGuide')}
      </Button>
    </Tooltip>
  );
}

interface B3AccountInfoProps {
  closeSidebar?: (x: boolean) => void;
}

export default function B3AccountInfo({ closeSidebar }: B3AccountInfoProps) {
  const [isMobile] = useMobile();

  const firstName = useAppSelector(({ company }) => company.customer.firstName);
  const lastName = useAppSelector(({ company }) => company.customer.lastName);

  const navigate = useNavigate();

  const b3Lang = useB3Lang();

  const handleItemClick = async (key: string | number) => {
    const item = list.find((v) => v.key === key);

    if (!item) return;

    if (item.key === 'logout') {
      navigate('/login?loginFlag=loggedOutLogin');
    } else if (item.type === 'path' && item.key) {
      navigate(item.key);
    }
    if (closeSidebar) {
      closeSidebar(false);
    }
  };

  const name = `${firstName}  ${lastName}`;

  const newList: ListItemProps[] = useMemo(() => {
    return list.map((item) => {
      return {
        key: item.key,
        name: b3Lang(item.idLang),
      };
    });
  }, [b3Lang]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isMobile ? 'start' : 'end',
        mr: '-5px',
        fontSize: '16px',
        color: '#333333',
        textAlign: 'center',
        alignItems: 'center',
      }}
    >
      <B3DropDown title={name} handleItemClick={handleItemClick} list={newList} />
      {isMobile && <BuyingGuideButton />}
    </Box>
  );
}
