'use client';

import React, { useMemo, useState } from 'react';
import { Label } from '@/app/_components/common/Label';
import Link from 'next/link';
import { useCompany } from '@/app/_components/CompanyWrapper';
import { Button } from '../_components/common/Button';

type TabData = {
  name: string;
  route: string;
};
const Tabs: Record<string, TabData> = {
  Settings: {
    name: 'Configuración',
    route: ''
  },
};


export default function Settings({ tab: tabName }: { tab: string }) {
  const tab = useMemo(() => {
    return Object.values(Tabs).find((tab, index) => tab.route === tabName) ?? Tabs.Settings!;
  }, [tabName]);

  return (
    <div className="flex flex-row p-12 gap-x-20">
      <SettingsMenu tab={tab} />
      {tab.name === 'Configuración' && (
        <GeneralSettings />
      )}
    </div>
  );
}

function SettingsMenu({ tab }: { tab: TabData }) {
  return (
    <div className="w-1/4 flex flex-col">
      {
        Object.values(Tabs).map((t, index) => (
          <Link
            key={index}
            href={`/settings/${t.route}`}
            className={`
                rounded-t-md pb-2 transition-all duration-200
                ease-in-out ${tab.route === tab.route ? '' : ''}
              `}
            style={
              {
                '-webkit-appearance': 'none',
              } as React.CSSProperties
            }
          >
            <div className={`
              my-auto flex items-center justify-start gap-2
              rounded px-4 py-3
              ${tab.route === t.route ? 'bg-purple-100' : ''}
            `}>
              {t.name}
            </div>
          </Link>
        ))
      }
    </div>
  );
}

function GeneralSettings() {
  const { data: company, signOut } = useCompany();

  return (
    <div className="w-full flex flex-col gap-y-8">
      <div className="flex flex-col p-8 bg-white rounded gap-y-5">
        <div className="flex flex-row justify-between items-center px-2 py-8 gap-x-4">
          <Label
            className="text-2xl font-medium"
          >
            General
          </Label>
          <Button onClick={signOut}>
            Sign out
          </Button>
        </div>
        <div className="flex flex-row justify-between items-center px-2 py-8 gap-x-4 border-b-2 border-gray-200">
          <Label className="text-md font-medium">Name</Label>
          <span className="text-lg">
            {company.name}
          </span>
        </div>
        <div className="flex flex-row justify-between items-center px-2 py-8 gap-x-4 border-b-2 border-gray-200">
          <Label className="text-md font-medium">Id</Label>
          <span className="text-lg">
            {company.id}
          </span>
        </div>
      </div>
    </div>
  );
}

