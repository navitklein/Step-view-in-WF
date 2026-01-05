
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppContextType, Project, NavigationContext, ContextState } from './types';
import { COLORS, ICONS, MOCK_INGREDIENTS, MOCK_RELEASES, MOCK_PROJECTS, MOCK_KNOBS, MOCK_BUILD_DEPS, MOCK_WORKFLOW, Ingredient, Release, Knob } from './constants';
import SidebarTier1 from './components/SidebarTier1';
import SidebarTier2 from './components/SidebarTier2';
import Header from './components/Header';

type TestStepPhaseId = 'DISCOVERY' | 'PRE_SUBMIT' | 'SUBMISSION' | 'RUNNING' | 'REVIEW_REQUIRED' | 'COMPLETED';

interface TestPhase {
  id: TestStepPhaseId;
  label: string;
  icon: React.ReactNode;
  requiresAction: boolean;
  description: string;
}

const TEST_PHASES: TestPhase[] = [
  { 
    id: 'DISCOVERY', 
    label: 'Discovery', 
    icon: <svg className="w-full h-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>, 
    requiresAction: false,
    description: 'Scanning environment and gathering test artifacts.'
  },
  { 
    id: 'PRE_SUBMIT', 
    label: 'Review', 
    icon: <svg className="w-full h-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>, 
    requiresAction: true,
    description: 'Human confirmation of the test suite configuration.'
  },
  { 
    id: 'SUBMISSION', 
    label: 'Submission', 
    icon: <svg className="w-full h-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>, 
    requiresAction: false,
    description: 'Dispatching payloads to the NGA orchestrator.'
  },
  { 
    id: 'RUNNING', 
    label: 'Execution', 
    icon: <svg className="w-full h-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, 
    requiresAction: false,
    description: 'Tests are live and running on physical silicon.'
  },
  { 
    id: 'REVIEW_REQUIRED', 
    label: 'Result', 
    icon: <svg className="w-full h-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, 
    requiresAction: true,
    description: 'Analyzing logs and providing final pass/fail resolution.'
  },
  { 
    id: 'COMPLETED', 
    label: 'Done', 
    icon: <svg className="w-full h-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>, 
    requiresAction: false,
    description: 'Step successfully completed and artifacts archived.'
  }
];

const App: React.FC = () => {
  const [nav, setNav] = useState<NavigationContext>({
    activeContext: AppContextType.PROJECT,
    activeProjectId: 'p3',
    sidebarExpanded: true,
    history: {
      [AppContextType.GLOBAL]: { activeTabId: 'Project Explorer', scrollPosition: 0 },
      [AppContextType.PERSONAL]: { activeTabId: 'Dashboard', scrollPosition: 0 },
      ['PROJECT_p3']: { activeTabId: 'Quick Builds', scrollPosition: 0 },
    }
  });

  const [selectedStepId, setSelectedStepId] = useState<string>('step2');
  const [currentTestPhase, setCurrentTestPhase] = useState<TestStepPhaseId>('RUNNING');
  const [isWorkflowSidebarCollapsed, setIsWorkflowSidebarCollapsed] = useState(false);
  const [isLifecyclePopoverOpen, setIsLifecyclePopoverOpen] = useState(false);
  
  // Test view collapse state - Table expanded by default, others collapsed
  const [collapsedSections, setCollapsedSections] = useState({
    settings: true,
    table: false,
    heatmap: true
  });

  // Build view collapse state - All collapsed by default
  const [collapsedBuildSections, setCollapsedBuildSections] = useState({
    settings: true,
    deps: true,
    knobs: true,
    straps: true,
    logs: true
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const [resOutcome, setResOutcome] = useState<'PASSED' | 'FAILED' | null>(null);
  const [executionProgress, setExecutionProgress] = useState(45);

  const toggleSection = (id: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBuildSection = (id: keyof typeof collapsedBuildSections) => {
    setCollapsedBuildSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllBuildSections = () => {
    const areAllCollapsed = Object.values(collapsedBuildSections).every(v => v === true);
    setCollapsedBuildSections({
      settings: !areAllCollapsed,
      deps: !areAllCollapsed,
      knobs: !areAllCollapsed,
      straps: !areAllCollapsed,
      logs: !areAllCollapsed
    });
  };

  const toggleAllTestSections = () => {
    const areAllCollapsed = Object.values(collapsedSections).every(v => v === true);
    setCollapsedSections({
      settings: !areAllCollapsed,
      table: !areAllCollapsed,
      heatmap: !areAllCollapsed
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsLifecyclePopoverOpen(false);
      }
    };
    if (isLifecyclePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLifecyclePopoverOpen]);

  useEffect(() => {
    if (currentTestPhase === 'RUNNING' || currentTestPhase === 'SUBMISSION' || currentTestPhase === 'DISCOVERY') {
      const interval = setInterval(() => {
        setExecutionProgress(prev => (prev < 99 ? prev + 1 : (currentTestPhase === 'RUNNING' ? 99 : 0)));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentTestPhase]);

  const activeProject = nav.activeProjectId 
    ? MOCK_PROJECTS.find(p => p.id === nav.activeProjectId) || { id: nav.activeProjectId, name: 'Arrow Lake-H', codeName: 'ARL-H', lastAccessed: 'Now' } as Project
    : null;

  const currentKey = nav.activeContext === AppContextType.PROJECT 
    ? `PROJECT_${nav.activeProjectId || 'BROWSER'}`
    : nav.activeContext;

  const activeTab = nav.history[currentKey]?.activeTabId || 'Dashboard';

  const handleContextChange = useCallback((ctx: AppContextType) => {
    setNav(prev => ({ ...prev, activeContext: ctx }));
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    setNav(prev => ({
      ...prev,
      history: {
        ...prev.history,
        [currentKey]: { ...prev.history[currentKey], activeTabId: tabId }
      }
    }));
  }, [currentKey]);

  const handleProjectSelect = useCallback((project: Project) => {
    const projectKey = `PROJECT_${project.id}`;
    setNav(prev => ({
      ...prev,
      activeProjectId: project.id,
      history: {
        ...prev.history,
        [projectKey]: prev.history[projectKey] || { activeTabId: 'Dashboard', scrollPosition: 0 }
      }
    }));
  }, []);

  const cycleDemoPhase = () => {
    if (selectedStepId === 'step1' || selectedStepId === 'step0') {
      // Build Step Cycling
      if (currentTestPhase === 'RUNNING') {
        setCurrentTestPhase('COMPLETED');
        setResOutcome('PASSED');
      } else if (currentTestPhase === 'COMPLETED' && resOutcome === 'PASSED') {
        setCurrentTestPhase('COMPLETED');
        setResOutcome('FAILED');
      } else {
        setCurrentTestPhase('RUNNING');
        setResOutcome(null);
      }
    } else {
      // Test Step Cycling
      const idx = TEST_PHASES.findIndex(p => p.id === currentTestPhase);
      const nextIdx = (idx + 1) % TEST_PHASES.length;
      setCurrentTestPhase(TEST_PHASES[nextIdx].id);
      setIsLifecyclePopoverOpen(false);
      setExecutionProgress(Math.floor(Math.random() * 40));
      
      if (TEST_PHASES[nextIdx].id === 'COMPLETED' && !resOutcome) {
        setResOutcome('PASSED');
      }
    }
  };

  const renderQuickBuildStepView = () => {
    const isCompleted = currentTestPhase === 'COMPLETED';
    const isRunning = currentTestPhase === 'RUNNING';
    const isUnifiedPatch = selectedStepId === 'step0';
    const isSuccess = isCompleted && resOutcome === 'PASSED';
    const areAllCollapsed = Object.values(collapsedBuildSections).every(v => v === true);

    let card1Bg = "bg-white";
    let card1TextColor = "text-slate-400";
    let card1PrimaryTextColor = "text-slate-600";
    let card1Label = "Active Build";
    
    if (isRunning) {
      card1Bg = "bg-brand shadow-[0_4px_12px_rgba(15,108,189,0.2)]";
      card1TextColor = "text-blue-100";
      card1PrimaryTextColor = "text-white";
      card1Label = isUnifiedPatch ? "Patching..." : "Building...";
    } else if (isCompleted) {
      const isFailed = resOutcome === 'FAILED';
      card1Bg = isFailed ? "bg-rose-600 shadow-[0_4px_12px_rgba(225,29,72,0.2)]" : "bg-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.2)]";
      card1Label = isFailed ? "FAILED" : "SUCCESS";
      card1TextColor = "text-white/80";
      card1PrimaryTextColor = "text-white";
    }

    const title = isUnifiedPatch ? "UNIFIED PATCH EXECUTION" : "IFWI BUILD EXECUTION";

    // Stats row logic
    const stats = [
      { label: 'Dep. Changes', val: isUnifiedPatch ? '12' : '4', color: 'blue' },
    ];
    if (!isUnifiedPatch) {
      stats.push({ label: 'Knob Overrides', val: '18', color: 'amber' });
      stats.push({ label: 'Strap Overrides', val: '2', color: 'purple' });
    }
    stats.push({ label: 'Package Size', val: isUnifiedPatch ? '4KB' : '32MB', color: 'slate' });

    return (
      <div className="flex flex-col space-y-4 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-500 h-full overflow-hidden">
        <div className="flex items-center justify-between shrink-0 mb-1">
          <div className="flex items-center gap-4">
             <h1 className="text-[18px] font-black text-slate-800 tracking-tight uppercase shrink-0">{title}</h1>
             <div className="h-4 w-[1px] bg-slate-200 mx-1" />
             <div className="flex items-center gap-2">
                <button onClick={cycleDemoPhase} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-black text-slate-600 uppercase transition-all flex items-center gap-1.5 group">
                   Cycle State <ICONS.ChevronRight className="w-2 h-2 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button onClick={toggleAllBuildSections} className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest transition-all flex items-center gap-1.5">
                   {areAllCollapsed ? 'Expand All' : 'Collapse All'}
                </button>
             </div>
          </div>
          
          <div className="flex gap-2">
            {isSuccess && (
              <>
                <button className="flex items-center gap-1.5 px-4 py-1.5 text-[9px] font-black text-white uppercase tracking-widest bg-brand rounded-md hover:bg-brand/90 shadow-sm transition-all animate-in fade-in zoom-in-95 duration-300">
                    <ICONS.Download className="w-3.5 h-3.5" /> DOWNLOAD PACKAGE
                </button>
                <button 
                  onClick={() => handleTabChange('Releases')}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[9px] font-black text-brand uppercase tracking-widest bg-white border border-brand rounded-md hover:bg-blue-50 transition-all animate-in fade-in zoom-in-95 duration-300"
                >
                    <ICONS.ExternalLink className="w-3.5 h-3.5" /> GO TO RELEASE VIEW
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div className={`${card1Bg} p-4 rounded-xl border border-transparent transition-all duration-500 flex flex-col justify-between h-[95px] relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-2">
               <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] ${card1TextColor}`}>{isUnifiedPatch ? 'Patch Summary' : 'Build Summary'}</h3>
               <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm border ${isCompleted ? 'bg-white/20 text-white border-white/30' : 'bg-blue-500/30 text-white border-blue-400/50 animate-pulse'}`}>
                  {card1Label}
               </span>
            </div>
            <div className="flex gap-10 items-end">
               <div className="flex flex-col">
                  <span className={`text-[7px] font-black uppercase mb-0.5 ${card1TextColor}`}>START TIME</span>
                  <span className={`text-[11px] font-bold ${card1PrimaryTextColor}`}>12/17/25 14:35</span>
               </div>
               <div className="flex flex-col">
                  <span className={`text-[7px] font-black uppercase mb-0.5 ${card1TextColor}`}>END TIME</span>
                  <span className={`text-[11px] font-bold ${card1PrimaryTextColor}`}>{isCompleted ? '12/17/25 14:55' : 'TBD'}</span>
               </div>
            </div>
            {/* Indeterminate Progress Bar on Bottom Border of Left Card */}
            {isRunning && (
              <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden bg-white/10">
                <div className="h-full bg-white/40 w-1/3 animate-indeterminate-progress shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-[95px] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-5">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Execution Time</span>
                <span className="text-[20px] font-black text-slate-800 mono tracking-tight leading-none">00d 00h 20m 14s</span>
                {isRunning && (
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest animate-pulse mt-2">{isUnifiedPatch ? 'Applying patches...' : 'Workspace initialized'}</span>
                )}
             </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-[95px]">
             <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">BASELINE</span>
                   <span className="text-[10px] font-black text-slate-800 mono tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">REL_ARL_24.12.0</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">TARGET</span>
                   <span className="text-[10px] font-black text-brand mono tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">REL_ARL_24.12.1-RC1</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
          {stats.map((stat, i) => (
            <div key={i} className="flex-shrink-0 min-w-[145px] bg-white p-3 px-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:border-slate-300">
              <div className="flex flex-col">
                <span className="text-[16px] font-black text-slate-800 tracking-tight leading-none mb-1">{stat.val}</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div onClick={() => toggleBuildSection('settings')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3"><div className="w-1 h-3 bg-amber-500 rounded-full" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{isUnifiedPatch ? 'PATCH SETTINGS' : 'BUILD SETTINGS'}</span></div>
              <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedBuildSections.settings ? '' : 'rotate-90'}`} />
            </div>
            {!collapsedBuildSections.settings && (
               <div className="p-0">
                  {isUnifiedPatch ? (
                    <div className="grid grid-cols-2 divide-x divide-slate-100">
                      <div className="flex flex-col">
                         <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SILICON</span><span className="text-[12px] font-black text-slate-800">DMR-AP</span></div>
                         <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STEP</span><span className="text-[12px] font-black text-slate-800">AO</span></div>
                         <div className="flex items-center justify-between px-6 py-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SoC SIGNING</span><span className="text-[12px] font-black text-slate-400 italic">None</span></div>
                      </div>
                      <div className="flex flex-col">
                         <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FIT1 SIGNING</span><span className="text-[11px] font-black text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded">ENABLED</span></div>
                         <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SOC ENCRYPTION</span><span className="text-[11px] font-black text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded">ENABLED</span></div>
                         <div className="flex items-center justify-between px-6 py-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FIT ENCRYPTION</span><span className="text-[11px] font-black text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded">ENABLED</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                      <div className="flex items-center justify-between px-6 py-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SILICON / PLATFORM</span><span className="text-[12px] font-black text-slate-800">DMR-AP / Arrow Lake-H</span></div>
                      <div className="flex items-center justify-between px-6 py-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STEP</span><span className="text-[12px] font-black text-slate-800">AO</span></div>
                    </div>
                  )}
               </div>
            )}
          </section>
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div onClick={() => toggleBuildSection('deps')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3"><div className="w-1 h-3 bg-blue-600 rounded-full" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{isUnifiedPatch ? 'PATCH DEPENDENCIES' : 'BUILD DEPENDENCIES'}</span></div>
              <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedBuildSections.deps ? '' : 'rotate-90'}`} />
            </div>
            {!collapsedBuildSections.deps && (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-[11px] border-collapse">
                   <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                     <tr><th className="px-6 py-3">Ingredient</th><th className="px-6 py-3">Baseline</th><th className="px-6 py-3">Target</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {MOCK_BUILD_DEPS.slice(0, 5).map((dep, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-6 py-2.5 font-bold text-slate-700">Ingredient_{dep.id}</td>
                          <td className="px-6 py-2.5 mono text-slate-400">{dep.version}</td>
                          <td className="px-6 py-2.5 mono text-brand font-bold">v25.1.0</td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
            )}
          </section>
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div onClick={() => toggleBuildSection('logs')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3"><div className="w-1 h-3 bg-slate-900 rounded-full" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">EXECUTION LOGS</span></div>
              <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedBuildSections.logs ? '' : 'rotate-90'}`} />
            </div>
            {!collapsedBuildSections.logs && (
               <div className="p-4 bg-slate-900 h-64 overflow-y-auto custom-scrollbar">
                  <div className="mono text-[10px] text-emerald-400/80 space-y-1">
                    <p>[14:35:01] INFO: Initializing execution workspace...</p>
                    <p>[14:35:10] INFO: Fetching baseline Rel_ARL_24.12.0...</p>
                    {isRunning && <p className="animate-pulse text-blue-400">[14:40:12] INFO: Processing {isUnifiedPatch ? 'patch metadata' : 'final IFWI image binary'}...</p>}
                    {isCompleted && resOutcome === 'PASSED' && <p className="text-emerald-400 font-black">[14:55:00] SUCCESS: Execution completed.</p>}
                    {isCompleted && resOutcome === 'FAILED' && <p className="text-rose-400 font-black">[14:55:00] ERROR: Execution failed in linking phase (code 0x2A).</p>}
                  </div>
               </div>
            )}
          </section>
        </div>
        <div className="shrink-0 py-2 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-4 text-[9px] font-black text-slate-300 uppercase tracking-widest"><span>WORKFLOW: FW_AUTO_BUILD_V2</span><span className="opacity-40">•</span><span>NODE: {isUnifiedPatch ? 'PATCH_SRV_01' : 'BLD_SRV_04'}_REGION_EU</span></div>
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isUnifiedPatch ? 'Orchestrator: PATCH_GEN_V1' : 'Compiler: INTEL_ONEAPI_2025.x'}</div>
        </div>
      </div>
    );
  };

  const renderTestStepView = () => {
    const isDiscovery = currentTestPhase === 'DISCOVERY';
    const isPreSubmit = currentTestPhase === 'PRE_SUBMIT';
    const isSubmission = currentTestPhase === 'SUBMISSION';
    const isRunning = currentTestPhase === 'RUNNING';
    const isReviewReq = currentTestPhase === 'REVIEW_REQUIRED';
    const isCompleted = currentTestPhase === 'COMPLETED';
    const areAllCollapsed = Object.values(collapsedSections).every(v => v === true);

    const currentPhaseIndex = TEST_PHASES.findIndex(p => p.id === currentTestPhase);
    const activePhaseObj = TEST_PHASES[currentPhaseIndex] || TEST_PHASES[0];

    let card1Bg = "bg-white";
    let card1TextColor = "text-slate-400";
    let card1PrimaryTextColor = "text-slate-600";
    let card1Label = "In progress";
    
    if (isRunning || isSubmission || isReviewReq) {
      card1Bg = "bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.2)]";
      card1TextColor = "text-blue-100";
      card1PrimaryTextColor = "text-white";
      card1Label = "In progress";
    } else if (isCompleted) {
      card1Bg = resOutcome === 'PASSED' ? "bg-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.2)]" : "bg-rose-600 shadow-[0_4px_12px_rgba(225,29,72,0.2)]";
      card1Label = resOutcome === 'PASSED' ? "PASSED" : "FAILED";
      card1TextColor = "text-white/80";
      card1PrimaryTextColor = "text-white";
    }

    const renderKPIStrip = () => {
      if (isDiscovery) return null;
      let stats = [
        { label: 'Discovered', val: '41', color: 'slate' },
        { label: 'Submitted', val: isPreSubmit ? '0' : '41', color: 'slate' },
        { label: 'Completed', val: isCompleted ? '41' : (isRunning ? '12' : '0'), color: 'slate' },
        { label: 'Running', val: isRunning ? '1' : '0', color: 'blue', pulse: isRunning },
        { label: 'Passed', val: isCompleted && resOutcome === 'PASSED' ? '41' : (isCompleted ? '32' : (isRunning ? '10' : '0')), color: 'emerald' },
        { label: 'Failed', val: isCompleted && resOutcome === 'FAILED' ? '41' : (isCompleted ? '9' : (isRunning ? '2' : '0')), color: 'rose' },
      ];

      return (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0 animate-in fade-in slide-in-from-left-2 duration-300">
          {stats.map((stat, i) => (
            <div key={i} className={`flex-shrink-0 min-w-[125px] bg-white p-3 px-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:border-slate-300 ${stat.color === 'blue' ? 'bg-blue-50/30 border-blue-100' : stat.color === 'emerald' ? 'bg-emerald-50/30 border-emerald-100' : stat.color === 'rose' ? 'bg-rose-50/30 border-rose-100' : ''}`}>
              <div className="flex flex-col">
                <span className={`text-[18px] font-black text-slate-800 tracking-tight leading-none mb-1 flex items-center gap-1.5`}>
                  {stat.val}
                  {stat.pulse && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider ${stat.color === 'slate' ? 'text-slate-400' : 'text-' + stat.color + '-600'}`}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      );
    };

    const renderTestSettings = () => {
      if (isDiscovery || isSubmission) return null;
      return (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div onClick={() => toggleSection('settings')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3"><div className="w-1 h-3 bg-amber-500 rounded-full" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">TEST SETTINGS</span></div>
            <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedSections.settings ? '' : 'rotate-90'}`} />
          </div>
          {!collapsedSections.settings && (
            <div className="p-0">
              <div className="grid grid-cols-2 divide-x divide-slate-100">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SILICON</span><span className="text-[12px] font-black text-slate-800">DMR-AP</span></div>
                  <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STEP</span><span className="text-[12px] font-black text-slate-800">AO</span></div>
                  <div className="flex items-center justify-between px-6 py-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NGA PROJECT</span><span className="text-[12px] font-black text-brand mono">VDC_QA</span></div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NGA ENVIRONMENT</span><span className="text-[11px] font-black text-slate-800 px-1.5 py-0.5 bg-slate-100 rounded">PRODUCTION</span></div>
                  <div className="flex flex-col px-6 py-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TEST SUITE</span>
                     <span className="text-[10px] font-black text-slate-800 mono bg-slate-50 px-2 py-1 border border-slate-100 rounded">VDC_QA_TestSuite_20_06_23_5</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      );
    };

    const renderTestlinesMatrix = () => {
      if (isDiscovery || isSubmission) {
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[300px]">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative">
               <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
               <ICONS.VDCLogo className="w-8 h-8 opacity-20" />
            </div>
            <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.2em] mb-3">{isDiscovery ? 'DISCOVERY IN PROGRESS' : 'DISPATCHING TO NGA'}</h3>
            <p className="text-[11px] text-slate-400 max-w-md leading-relaxed font-medium">Please wait while the system scans for tests and organizes the execution queue. This typically takes 5-15 minutes depending on project size...</p>
            <div className="mt-8 w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${executionProgress}%` }} />
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div onClick={() => toggleSection('table')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-1 h-3 bg-blue-600 rounded-full" />
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">TESTLINES MATRIX (41 ITEMS)</span>
              </div>
              <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedSections.table ? '' : 'rotate-90'}`} />
            </div>
            {!collapsedSections.table && (
              <div className="overflow-x-auto max-h-[400px] custom-scrollbar overflow-y-auto">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3">Testline Name</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...Array(41)].map((_, i) => {
                      const states = ['PASSED', 'FAILED', 'RUNNING', 'PENDING'];
                      let status = isPreSubmit ? 'PENDING' : states[i % 4];
                      if (isCompleted) status = resOutcome || 'PASSED';
                      return (
                        <tr key={i} className="hover:bg-blue-50/20 group transition-colors">
                          <td className="px-6 py-2.5 font-bold text-slate-700">GNR_CI_Prod_Cycle_{1024 + i}</td>
                          <td className="px-6 py-2.5">
                             <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase ring-1 ring-inset ${status === 'PASSED' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : status === 'FAILED' ? 'bg-rose-50 text-rose-600 ring-rose-100' : status === 'RUNNING' ? 'bg-blue-50 text-blue-600 ring-blue-100 animate-pulse' : 'bg-slate-50 text-slate-400 ring-slate-100'}`}>
                               <div className={`w-1 h-1 rounded-full ${status === 'PASSED' ? 'bg-emerald-500' : status === 'FAILED' ? 'bg-rose-500' : status === 'RUNNING' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                               {status}
                             </span>
                          </td>
                          <td className="px-6 py-2.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="px-3 py-1 text-[9px] font-black text-blue-600 hover:bg-blue-100 rounded uppercase tracking-widest border border-blue-50">Details</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {!isPreSubmit && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div onClick={() => toggleSection('heatmap')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3"><div className="w-1 h-3 bg-purple-600 rounded-full" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">HEAT MAP VIEW</span></div>
                <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedSections.heatmap ? '' : 'rotate-90'}`} />
              </div>
              {!collapsedSections.heatmap && (
                <div className="p-6">
                  <div className="grid grid-cols-10 gap-2">
                    {[...Array(40)].map((_, i) => {
                      const states = ['bg-emerald-500', 'bg-rose-500', 'bg-blue-500', 'bg-slate-300'];
                      let statusClass = states[i % 4];
                      if (isCompleted) statusClass = resOutcome === 'PASSED' ? 'bg-emerald-500' : 'bg-rose-500';
                      return (
                        <div key={i} className={`aspect-square rounded shadow-sm border border-white/20 transition-all hover:scale-110 cursor-pointer ${statusClass} ${statusClass === 'bg-blue-500' ? 'animate-pulse' : ''}`} title={`Testline ${i+1}`} />
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      );
    };

    return (
      <div className="flex flex-col space-y-4 pb-10 max-w-[1600px] mx-auto animate-in fade-in duration-500 h-full overflow-hidden">
        {/* Step Header */}
        <div className="flex items-center justify-between shrink-0 mb-1">
          <div className="flex items-center gap-4">
             <h1 className="text-[18px] font-black text-slate-800 tracking-tight uppercase shrink-0">TEST step execution</h1>
             <div className="h-4 w-[1px] bg-slate-200 mx-1" />
             <div className="flex items-center gap-2">
                <button onClick={cycleDemoPhase} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-black text-slate-600 uppercase transition-all flex items-center gap-1.5 group">
                   Cycle State <ICONS.ChevronRight className="w-2 h-2 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button onClick={toggleAllTestSections} className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest transition-all flex items-center gap-1.5">
                   {areAllCollapsed ? 'Expand All' : 'Collapse All'}
                </button>
             </div>
          </div>
        </div>

        {/* 3-Card Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div className={`${card1Bg} p-4 rounded-xl border border-transparent flex flex-col justify-between h-[95px]`}>
            <div className="flex items-center justify-between mb-2">
               <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] ${card1TextColor}`}>NGA test summary</h3>
               <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm border ${isCompleted ? 'bg-white/20 text-white border-white/30' : 'bg-blue-500/30 text-white border-blue-400/50 animate-pulse'}`}>{card1Label}</span>
            </div>
            <div className="flex gap-6 items-end">
               <div className="flex flex-col"><span className={`text-[7px] font-black uppercase mb-0.5 ${card1TextColor}`}>START TIME</span><span className={`text-[11px] font-bold ${card1PrimaryTextColor}`}>12/17/25 14:35</span></div>
               <div className="flex flex-col"><span className={`text-[7px] font-black uppercase mb-0.5 ${card1TextColor}`}>END TIME</span><span className={`text-[11px] font-bold ${card1PrimaryTextColor}`}>{isCompleted ? '12/18/25 09:12' : 'TBD'}</span></div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-[95px] relative overflow-hidden">
             <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Elapsed Duration</span>
                <span className="text-[20px] font-black text-slate-800 mono tracking-tight leading-none">18d 04h 21m 45s</span>
             </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[95px] relative">
             <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3 relative" ref={popoverRef}>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest shrink-0">STEP STATE</span>
                      <button onClick={() => setIsLifecyclePopoverOpen(!isLifecyclePopoverOpen)} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full border border-slate-100 hover:bg-slate-100 transition-all group shrink-0 shadow-sm">
                        <div className="flex items-center gap-1">
                          {TEST_PHASES.map((p, i) => (
                            <div key={p.id} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentPhaseIndex ? 'bg-blue-500 ring-2 ring-blue-200 animate-pulse scale-110' : i < currentPhaseIndex ? 'bg-emerald-400' : 'bg-slate-200 opacity-50'}`} />
                          ))}
                        </div>
                      </button>

                      {/* Step Lifecycle Popover - Compact Version */}
                      {isLifecyclePopoverOpen && (
                        <div className="absolute top-10 left-0 w-[180px] bg-white rounded-lg shadow-2xl border border-slate-200 z-[100] p-2.5 animate-in fade-in zoom-in-95 duration-200">
                          <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">LIFECYCLE</h4>
                          <div className="space-y-1">
                            {TEST_PHASES.map((phase, idx) => {
                              const isActive = phase.id === currentTestPhase;
                              const isPast = idx < currentPhaseIndex;
                              return (
                                <div key={phase.id} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-all ${isActive ? 'bg-blue-50/50' : ''}`}>
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isActive ? 'border-brand bg-brand' : isPast ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                     {isPast && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                     {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase tracking-tight truncate ${isActive ? 'text-brand' : isPast ? 'text-emerald-600' : 'text-slate-400'}`}>{phase.label}</span>
                                  {phase.requiresAction && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                   </div>
                   <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ring-1 ring-inset ${isCompleted ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : 'bg-blue-50 text-blue-600 ring-blue-100'}`}>{activePhaseObj.label}</span>
                </div>
                <div className="h-[1px] bg-slate-50 w-full" />
                <div className="flex items-center justify-between"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">NGA CONNECTION</span><span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded text-[8px] font-black uppercase ring-1 ring-inset ring-green-100">ONLINE</span></div>
             </div>
             {isRunning ? (
               <div className="mt-2 px-4">
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-[7px] font-black text-slate-300 uppercase">Execution progress</span>
                   <span className="text-[8px] font-black text-blue-600 mono">{executionProgress}%</span>
                 </div>
                 <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${executionProgress}%` }} />
                 </div>
               </div>
             ) : ( <div className="h-4" /> )}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {renderKPIStrip()}
          {renderTestSettings()}
          {renderTestlinesMatrix()}
        </div>

        {/* Step Footer */}
        <div className="shrink-0 py-2 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-4 text-[9px] font-black text-slate-300 uppercase tracking-widest"><span>Suite: ARL_H_VAL_V3</span><span className="opacity-40">•</span><span>Branch: main/firmware_rc</span></div>
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Orchestrator: NGA_PROD_11.x</div>
        </div>
      </div>
    );
  };

  const renderWorkflowRunView = () => {
    return (
      <div className="h-full flex flex-col bg-[#f5f7f9] overflow-hidden">
        <header className="px-8 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-0.5">
              <h1 className="text-[17px] font-black text-slate-800 tracking-tight">Foo_2025_12_17_14_21_30</h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[8px] font-black uppercase ring-1 ring-emerald-200/50 shadow-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> ACTIVE
              </div>
            </div>
            <div className="flex items-center gap-5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>TRIGGERED BY <span className="text-slate-600 font-black">JD DAYAN, RONI</span></span>
              <span>• ELAPSED 18d+</span>
              <span>• RUN ID <span className="text-slate-600 mono font-black">507</span></span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <aside className={`transition-all duration-300 border-r border-slate-200 bg-white flex flex-col shrink-0 z-10 ${isWorkflowSidebarCollapsed ? 'w-20' : 'w-[280px]'}`}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              {!isWorkflowSidebarCollapsed && <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">WORKFLOW STAGES <span className="text-slate-300 ml-1">4</span></h2>}
              <button onClick={() => setIsWorkflowSidebarCollapsed(!isWorkflowSidebarCollapsed)} className={`p-1.5 hover:bg-slate-50 rounded text-slate-400 transition-all ${isWorkflowSidebarCollapsed ? 'mx-auto' : ''}`}><svg className={`w-4 h-4 transition-transform ${isWorkflowSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-slate-50/20">
              {MOCK_WORKFLOW.map(stage => {
                const isStageActive = stage.steps.some(s => s.id === selectedStepId);
                return (
                  <div key={stage.id} className={`p-3 rounded-lg border transition-all ${isStageActive ? 'border-blue-200 bg-white shadow-sm ring-2 ring-blue-50/10' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      {!isWorkflowSidebarCollapsed && (
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${stage.status === 'Success' ? 'bg-emerald-500' : (stage.status === 'In progress' ? 'bg-blue-500' : 'bg-slate-300')}`} />
                          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{stage.name}</h3>
                        </div>
                      )}
                    </div>
                    {!isWorkflowSidebarCollapsed && (
                      <div className="space-y-1">
                        {stage.steps.map(step => (
                          <button key={step.id} onClick={() => setSelectedStepId(step.id)} className={`w-full text-left px-2.5 py-1.5 rounded border transition-all flex items-center justify-between ${selectedStepId === step.id ? 'bg-blue-50 border-blue-100 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}><span className="text-[10px] uppercase tracking-tight">{step.name}</span></button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto p-6 px-10 custom-scrollbar relative bg-slate-50/30">
             {(selectedStepId === 'step1' || selectedStepId === 'step0') ? renderQuickBuildStepView() : renderTestStepView()}
          </main>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'Dashboard') return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Personal Workspace</h1>
        <div className="bg-white p-12 rounded-2xl border border-slate-200 min-h-[240px] flex flex-col justify-center items-center shadow-sm">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">ACTIVE ENGINEERING RUNS</p>
          <p className="text-6xl font-black text-blue-600 tracking-tighter">14</p>
        </div>
      </div>
    );
    return (
      <main className="p-8 flex flex-col items-center justify-center min-h-[500px]">
        <ICONS.VDCLogo className="w-16 h-16 opacity-10 mb-6" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CONTEXT__{activeTab}__UNAVAILABLE</p>
      </main>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white selection:bg-blue-100 selection:text-blue-900">
      <SidebarTier1 activeContext={nav.activeContext} onContextChange={handleContextChange} />
      <SidebarTier2 
        activeContext={nav.activeContext} 
        activeProject={activeProject} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onProjectSelect={handleProjectSelect} 
        onProjectDeselect={() => setNav(p => ({ ...p, activeProjectId: null }))} 
        expanded={nav.sidebarExpanded} 
        onToggle={() => setNav(p => ({ ...p, sidebarExpanded: !p.sidebarExpanded }))} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeContext={nav.activeContext} activeProject={activeProject} activeTab={activeTab} onToggleSidebar={() => setNav(p => ({ ...p, sidebarExpanded: !p.sidebarExpanded }))} isSidebarExpanded={nav.sidebarExpanded} />
        <div className="flex-1 overflow-hidden">
           {activeTab === 'Quick Builds' || activeTab === 'Workflows' ? renderWorkflowRunView() : renderContent()}
        </div>
        <div className="h-6 bg-slate-900 flex items-center px-4 justify-between border-t border-slate-800 text-[9px] font-black tracking-widest text-slate-500 uppercase shrink-0">
           <div className="flex items-center gap-5"><span><div className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1.5 shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> API ACTIVE</span></div>
           <div className="mono text-slate-400 tracking-tighter">BUILD v4.14.0 // {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
};

export default App;
