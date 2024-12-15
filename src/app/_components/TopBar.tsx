'use client';

import Link from 'next/link';
import Logo from 'public/images/Logo.svg';
import { useEffect, useRef, useState } from 'react';
import { Label } from './Label';
import { useCompany } from '../CompanyWrapper';

export default function TopBar({
  page,
}: {
  page?: "sources" | "settings",
}) {
  const { data: company } = useCompany();

  const [_, setIsMenuVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsMenuVisible(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="px-10 relative flex h-[58px] items-center justify-between border-b border-gray-200 bg-[#fdfdfd]">
        <Link
          href={'/campaigns'}
          legacyBehavior
          className="left-14 flex items-center cursor-pointer"
        >
          <Logo className="w-10 cursor-pointer" />
        </Link>
        <div className="flex items-center justify-center gap-x-4">
          <TopBarLink
            route={'/sources'}
            label="Sources"
            isActive={page === 'sources'}
          />
          <TopBarLink
            route={'/settings'}
            label="Settings"
            isActive={page === 'settings'}
          />
        </div>
        <div></div>
      </div>
    </>
  );
}

function TopBarLink({
  route,
  isActive,
  label,
}: {
  route: string,
  isActive: boolean,
  label: string,
}) {
  const activeStyles = {
    borderBottom: '1px solid #6e120d',
  };

  return (
    <Link href={route} legacyBehavior>
      <li className={`mx-2 flex cursor-pointer items-center py-2`}>
        <div
          className={`'opacity-0' : 'opacity-100' transition-opacity duration-500 ease-in-out`}
          style={isActive ? activeStyles : {}}
        >
          <Label
            className={`text-md font-semibold ${isActive ? 'text-[#6e120d]' : 'text-black'} cursor-pointer`}
          >
            {label}
          </Label>
        </div>
      </li>
    </Link>
  );
}
