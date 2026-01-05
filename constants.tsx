
import React from 'react';

export const COLORS = {
  primary: '#0f6cbd',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate50: '#f8fafc',
};

export const MOCK_PROJECTS = [
  { id: 'p1', name: 'Meteor Lake-S', codeName: 'MTL-S', lastAccessed: '2h ago' },
  { id: 'p2', name: 'Lunar Lake-M', codeName: 'LNL-M', lastAccessed: '4h ago' },
  { id: 'p3', name: 'Arrow Lake-H', codeName: 'ARL-H', lastAccessed: '1d ago' },
  { id: 'p4', name: 'Panther Canyon', codeName: 'PAC-S', lastAccessed: '2d ago' },
];

export interface Knob {
  id: string;
  name: string;
  path: string;
  displayValue: string;
  rawValue: string;
  status: 'active' | 'warning' | 'error';
  isOverridden?: boolean;
}

export const MOCK_KNOBS: Knob[] = [
  { id: 'k1', name: 'PchEnergyReport', path: 'Intel Advanced Menu/PCH-IO Configuration/Energy Reporting', displayValue: 'Disabled', rawValue: '0x00', status: 'active', isOverridden: true },
  { id: 'k2', name: 'FastBootTimeOut', path: 'Boot/Boot Configuration', displayValue: '1', rawValue: '0x0001', status: 'active', isOverridden: false },
  { id: 'k3', name: 'MipiCam_ControlLogic2_GpioFunction_2', path: 'SA Configuration/MIPI Camera/Control Logic', displayValue: 'Disabled', rawValue: '0x00', status: 'active', isOverridden: true },
  { id: 'k4', name: 'CpuPcieSlot1_GenSpeed', path: 'Intel Advanced Menu/CPU Configuration/PCI Express/Speed', displayValue: 'Auto', rawValue: '0xFF', status: 'active', isOverridden: false },
  { id: 'k5', name: 'TccActivationOffset', path: 'Intel Advanced Menu/CPU Configuration', displayValue: '0', rawValue: '0x00', status: 'active', isOverridden: true },
  { id: 'k6', name: 'VmxEnable', path: 'CPU/Security', displayValue: 'Enabled', rawValue: '0x01', status: 'active', isOverridden: false },
  { id: 'k7', name: 'HyperThreading', path: 'CPU/Performance', displayValue: 'Enabled', rawValue: '0x01', status: 'active', isOverridden: false },
  { id: 'k8', name: 'IgpMemorySize', path: 'Graphics/Internal', displayValue: '64MB', rawValue: '0x40', status: 'active', isOverridden: true },
  { id: 'k9', name: 'SataModeSelection', path: 'Storage/PCH', displayValue: 'AHCI', rawValue: '0x00', status: 'active', isOverridden: false },
  { id: 'k10', name: 'UsbPortDisable_1', path: 'Connectivity/USB', displayValue: 'Disabled', rawValue: '0x00', status: 'active', isOverridden: true },
  { id: 'k11', name: 'FanPolicy_1', path: 'Thermal/Fans', displayValue: 'Quiet', rawValue: '0x02', status: 'active', isOverridden: true },
  { id: 'k12', name: 'DramVoltage', path: 'Memory/Overclocking', displayValue: '1.2V', rawValue: '0x04B0', status: 'active', isOverridden: true },
  { id: 'k13', name: 'SecureBootMode', path: 'Security/Boot', displayValue: 'Standard', rawValue: '0x00', status: 'active', isOverridden: false },
  { id: 'k14', name: 'TpmState', path: 'Security/TPM', displayValue: 'Enabled', rawValue: '0x01', status: 'active', isOverridden: false },
  { id: 'k15', name: 'AudioCodecPower', path: 'PCH/Audio', displayValue: 'On', rawValue: '0x01', status: 'active', isOverridden: true },
  { id: 'k16', name: 'DisplayResolution_Limit', path: 'Graphics/Display', displayValue: '4K', rawValue: '0x0F00', status: 'active', isOverridden: false },
  { id: 'k17', name: 'PcieLtrSupport', path: 'PCH/PCI Express', displayValue: 'Enabled', rawValue: '0x01', status: 'active', isOverridden: true },
  { id: 'k18', name: 'SpdWriteDisable', path: 'Memory/Security', displayValue: 'Off', rawValue: '0x00', status: 'active', isOverridden: true },
];

export interface Ingredient {
  id: string;
  type: string;
  name: string;
  releasesCount: number;
  siliconFamily: string;
  segment?: string;
  step?: string;
  validation?: string;
  description?: string;
}

export const MOCK_INGREDIENTS: Ingredient[] = [
  { id: '1040', type: 'ACE-ROM-EXT', name: 'PTL_ACE_ROM_EXT_Release_Prod_ACE_ROM_EXT_0', releasesCount: 3, siliconFamily: 'PTL' },
  { id: '1019', type: 'AUNIT', name: 'PTL_AUNIT_Release_Prod_AUNIT_0', releasesCount: 8, siliconFamily: 'PTL' },
  { id: '1022', type: 'BIOS', name: 'PTL_BIOS_Release_Prod_BIOS_0', releasesCount: 12, siliconFamily: 'PTL' },
  { id: '1020', type: 'BIOS', name: 'PTL_BIOS_Release_Prod_BIOS_1', releasesCount: 2, siliconFamily: 'PTL' },
  { id: '1041', type: 'CNVI', name: 'PTL_CNVi_Release_Prod_CNVI_0', releasesCount: 1, siliconFamily: 'PTL' },
  { id: '1021', type: 'CSME', name: 'PTL_CSME_Release_Prod_CSME_0', releasesCount: 12, siliconFamily: 'PTL', description: 'No description provided' },
  { id: '1005', type: 'CSME', name: 'PTL_CSME_Release_Prod_CSME_1', releasesCount: 10, siliconFamily: 'PTL' },
  { id: '1006', type: 'EC', name: 'PTL_EC_Release_Prod_EC_0', releasesCount: 8, siliconFamily: 'PTL' },
  { id: '1016', type: 'IFWI', name: 'PTL_PR01_A0A0-XXXODCA_RPRF_SED0_11F7069A', releasesCount: 7, siliconFamily: 'PTL', segment: 'PTL-P' },
];

export interface Release {
  id: string;
  version: string;
  changedDeps: string;
  releasedBy: string;
  releasedDate: string;
  releasedWW: string;
  isModified?: boolean;
}

export const MOCK_RELEASES: Release[] = [
  { id: '1166', version: '2025.17.7.3', changedDeps: '0/0', releasedBy: 'Nagorski, Wojciech', releasedDate: '4/27/25 10:10 AM', releasedWW: '2025WW17.0' },
  { id: '1151', version: '2025.17.3.1', changedDeps: '0/0', releasedBy: 'Nagorski, Wojciech', releasedDate: '4/23/25 11:47 AM', releasedWW: '2025WW17.3' },
];

export const MOCK_BUILD_DEPS: Release[] = [
  { id: 'R102', version: 'v24.1.0', changedDeps: '2/4', releasedBy: 'System', releasedDate: 'Today', releasedWW: 'WW25.1', isModified: true },
  { id: 'R099', version: 'v23.9.4', changedDeps: '0/0', releasedBy: 'System', releasedDate: 'Yesterday', releasedWW: 'WW24.9', isModified: false },
  { id: 'R084', version: 'v22.0.1', changedDeps: '1/2', releasedBy: 'System', releasedDate: '2d ago', releasedWW: 'WW24.7', isModified: true },
  { id: 'R077', version: 'v21.5.0', changedDeps: '0/0', releasedBy: 'System', releasedDate: '1w ago', releasedWW: 'WW24.1', isModified: false },
  { id: 'R065', version: 'v20.2.1', changedDeps: '1/5', releasedBy: 'Admin', releasedDate: '2w ago', releasedWW: 'WW24.0', isModified: true },
  { id: 'R052', version: 'v19.1.0', changedDeps: '0/0', releasedBy: 'Admin', releasedDate: '3w ago', releasedWW: 'WW23.9', isModified: false },
  { id: 'R041', version: 'v18.4.2', changedDeps: '3/3', releasedBy: 'BuildBot', releasedDate: '1m ago', releasedWW: 'WW23.5', isModified: true },
  { id: 'R038', version: 'v18.0.0', changedDeps: '0/0', releasedBy: 'BuildBot', releasedDate: '1.2m ago', releasedWW: 'WW23.1', isModified: false },
  { id: 'R022', version: 'v17.2.5', changedDeps: '1/1', releasedBy: 'System', releasedDate: '2m ago', releasedWW: 'WW22.8', isModified: true },
  { id: 'R010', version: 'v16.0.0', changedDeps: '0/0', releasedBy: 'System', releasedDate: '3m ago', releasedWW: 'WW22.4', isModified: false },
];

// Added workflow interfaces and MOCK_WORKFLOW to fix errors in App.tsx
export interface WorkflowStep {
  id: string;
  name: string;
  status: 'Success' | 'In progress' | 'Pending';
}

export interface WorkflowStage {
  id: string;
  name: string;
  status: 'Success' | 'In progress' | 'Pending';
  progress: number;
  steps: WorkflowStep[];
}

export const MOCK_WORKFLOW: WorkflowStage[] = [
  {
    id: 'stage1',
    name: 'IFWI Build',
    status: 'Success',
    progress: 100,
    steps: [
      { id: 'step1', name: 'IFWI Build Step', status: 'Success' },
    ],
  },
  {
    id: 'stage2',
    name: 'Validation',
    status: 'In progress',
    progress: 45,
    steps: [
      { id: 'step2', name: 'Test Step', status: 'In progress' },
      { id: 'step3', name: 'Performance Step', status: 'Pending' },
    ],
  },
];

export const ICONS = {
  VDCLogo: (props: any) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="50" cy="50" r="48" fill="transparent" />
      <path d="M50 15C35 15 23 25 18 38C25 32 35 28 45 28C55 28 62 35 62 35C62 35 55 15 50 15Z" fill="#fcc43d" />
      <path d="M85 50C85 35 75 23 62 18C68 25 72 35 72 45C72 55 65 62 65 62C65 62 85 55 85 50Z" fill="white" />
      <path d="M50 85C65 85 77 75 82 62C75 68 65 72 55 72C45 72 38 65 38 65C38 65 45 85 50 85Z" fill="white" />
      <path d="M15 50C15 65 25 77 38 82C32 75 28 65 28 55C28 45 35 38 35 38C35 38 15 45 15 50Z" fill="white" />
    </svg>
  ),
  Global: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  Personal: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Project: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Search: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  ChevronRight: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Settings: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ExternalLink: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  MoreHorizontal: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  ),
  Download: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Terminal: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Filter: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
};
