import { Users } from 'lucide-react';

import {
  SidebarContainer,
  SidebarItem,
} from '@/components/navigation/SidebarNavigation';

export default function StatisticsSidebar() {
  const sections = [
    {
      path: '/statistics',
      label: 'Demographics',
      icon: Users,
      description: 'Population growth',
    },
  ];

  return (
    <SidebarContainer title='Statistics'>
      <ul className='space-y-1'>
        {sections.map(section => (
          <SidebarItem key={section.path} {...section} />
        ))}
      </ul>
    </SidebarContainer>
  );
}
