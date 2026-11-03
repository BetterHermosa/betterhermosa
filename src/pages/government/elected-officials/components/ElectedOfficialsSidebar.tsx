import { BookOpenIcon, BuildingIcon } from 'lucide-react';

import legislativeData from '@/data/directory/legislative.json';
import {
  SidebarContainer,
  SidebarGroup,
  SidebarItem,
} from '@/components/navigation/SidebarNavigation';

const hasCommittees = legislativeData.some(
  item => (item.permanent_committees?.length ?? 0) > 0
);

export default function ElectedOfficialsSidebar() {
  const groups = [
    {
      title: 'Officials',
      items: [
        {
          label: 'Elected Officials',
          icon: BuildingIcon,
          path: '/government/elected-officials',
        },
      ],
    },
    ...(hasCommittees
      ? [
          {
            title: 'Legislative',
            items: [
              {
                label: 'Standing Committees',
                icon: BookOpenIcon,
                path: '/government/elected-officials/committees',
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <SidebarContainer title='Municipal Government'>
      {groups.map(group => (
        <SidebarGroup key={group.title} title={group.title}>
          {group.items.map(item => (
            <SidebarItem key={item.path} {...item} />
          ))}
        </SidebarGroup>
      ))}
    </SidebarContainer>
  );
}
