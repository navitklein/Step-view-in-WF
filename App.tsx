
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppContextType, Project, NavigationContext, ContextState } from './types';
import { COLORS, ICONS, MOCK_INGREDIENTS, MOCK_RELEASES, MOCK_PROJECTS, MOCK_KNOBS, MOCK_STRAPS, MOCK_BUILD_DEPS, MOCK_WORKFLOW, Ingredient, Release, Knob } from './constants';
import SidebarTier1 from './components/SidebarTier1';
import SidebarTier2 from './components/SidebarTier2';
import Header from './components/Header';

type TestStepPhaseId = 'DISCOVERY' | 'PRE_SUBMIT' | 'SUBMISSION' | 'RUNNING' | 'REVIEW_REQUIRED' | 'COMPLETED';

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

  const activeProject = useMemo(() => 
    MOCK_PROJECTS.find(p => p.id === nav.activeProjectId) || null
  , [nav.activeProjectId]);

  const activeTab = useMemo(() => {
    const currentKey = nav.activeContext === AppContextType.PROJECT ? `PROJECT_${nav.activeProjectId || 'BROWSER'}` : nav.activeContext;
    return nav.history[currentKey]?.activeTabId || 'Dashboard';
  }, [nav.activeContext, nav.activeProjectId, nav.history]);

  const [selectedStepId, setSelectedStepId] = useState<string>('step1');
  const [currentTestPhase, setCurrentTestPhase] = useState<TestStepPhaseId>('RUNNING');
  const [isWorkflowSidebarCollapsed, setIsWorkflowSidebarCollapsed] = useState(false);
  
  const [showAllDeps, setShowAllDeps] = useState(false);
  const [knobsPage, setKnobsPage] = useState(0);

  const displayedDeps = useMemo(() => {
    return showAllDeps ? MOCK_BUILD_DEPS : MOCK_BUILD_DEPS.filter(d => d.isModified);
  }, [showAllDeps]);

  const buildScrollRef = useRef<HTMLDivElement>(null);

  const [collapsedBuildSections, setCollapsedBuildSections] = useState({ settings: true, deps: true, knobs: false, straps: true, logs: true });

  const [resOutcome, setResOutcome] = useState<'PASSED' | 'FAILED' | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [buildSeconds, setBuildSeconds] = useState(1214);

  useEffect(() => {
    let interval: any;
    if (currentTestPhase === 'RUNNING' && (selectedStepId === 'step1' || selectedStepId === 'step0')) {
      interval = setInterval(() => {
        setBuildSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentTestPhase, selectedStepId]);

  const formatSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  const handleTabChange = useCallback((tabId: string) => {
    const currentKey = nav.activeContext === AppContextType.PROJECT ? `PROJECT_${nav.activeProjectId || 'BROWSER'}` : nav.activeContext;
    setNav(prev => ({
      ...prev,
      history: { ...prev.history, [currentKey]: { ...prev.history[currentKey], activeTabId: tabId } }
    }));
  }, [nav.activeContext, nav.activeProjectId]);

  const cycleDemoPhase = () => {
    if (selectedStepId === 'step1' || selectedStepId === 'step0') {
      if (currentTestPhase === 'RUNNING') {
        setCurrentTestPhase('COMPLETED');
        setResOutcome('PASSED');
      } else if (currentTestPhase === 'COMPLETED' && resOutcome === 'PASSED') {
        setCurrentTestPhase('COMPLETED');
        setResOutcome('FAILED');
      } else {
        setCurrentTestPhase('RUNNING');
        setResOutcome(null);
        setBuildSeconds(1214);
      }
    }
  };

  const toggleBuildSection = (id: keyof typeof collapsedBuildSections) => {
    setCollapsedBuildSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderQuickBuildStepView = () => {
    const isCompleted = currentTestPhase === 'COMPLETED';
    const isRunning = currentTestPhase === 'RUNNING';
    const isUnifiedPatch = selectedStepId === 'step0';
    const isSuccess = isCompleted && resOutcome === 'PASSED';
    const isFailed = isCompleted && resOutcome === 'FAILED';

    const title = isUnifiedPatch ? "UNIFIED PATCH EXECUTION" : "IFWI BUILD EXECUTION";
    const totalDeps = MOCK_BUILD_DEPS.length;
    const changedDepsCount = MOCK_BUILD_DEPS.filter(d => d.isModified).length;
    
    const stats = [
      { label: 'Dep. Changes', val: `${changedDepsCount}/${totalDeps}`, color: 'blue' },
      { label: 'Package Size', val: isUnifiedPatch ? '4KB' : '32MB', color: 'slate' },
      { label: 'Complexity', val: isUnifiedPatch ? 'Low' : 'High', color: 'purple' }
    ];

    return (
      <div className="flex flex-col space-y-4 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-500 h-full overflow-hidden relative">
        <div className="flex items-center justify-between shrink-0 mb-1">
          <div className="flex items-center gap-4">
             <h1 className="text-[18px] font-black text-slate-800 tracking-tight uppercase shrink-0">{title}</h1>
             <div className="h-4 w-[1px] bg-slate-200 mx-1" />
             <div className="flex items-center gap-2">
                <button onClick={cycleDemoPhase} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-black text-slate-600 uppercase transition-all flex items-center gap-1.5 group">
                   Cycle State <ICONS.ChevronRight className="w-2 h-2 group-hover:translate-x-0.5 transition-transform" />
                </button>
             </div>
          </div>
        </div>

        {/* 2-Column High Density Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
          
          {/* Main Summary Card (Pivot between Flow and Result) */}
          <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[115px] relative overflow-hidden transition-all duration-500 ${isSuccess ? 'bg-emerald-50/20 border-emerald-200' : isFailed ? 'bg-rose-50/20 border-rose-200' : ''}`}>
             
             {isCompleted ? (
               /* FINISHED STATE: Result Certificate Focus */
               <div className="flex flex-col h-full p-4 animate-in zoom-in-95 duration-500">
                  <div className="flex items-center justify-between mb-1 shrink-0">
                     <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ring-1 ring-inset ${isSuccess ? 'bg-emerald-100 text-emerald-700 ring-emerald-200' : 'bg-rose-100 text-rose-700 ring-rose-200'}`}>
                           {isSuccess ? 'SUCCESS' : 'FAILURE'}
                        </span>
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest bg-white/50 px-1.5 py-0.5 rounded border border-slate-100">RELEASE ID: 1166</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <button onClick={() => handleTabChange('Releases')} className={`flex items-center gap-1.5 px-2 py-1 text-[8px] font-black uppercase tracking-widest bg-white rounded border transition-all ${isSuccess ? 'text-emerald-700 border-emerald-200 hover:bg-emerald-50' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                           <ICONS.ExternalLink className="w-2.5 h-2.5" /> VIEW RELEASE
                        </button>
                        <button onClick={() => setIsFavorite(!isFavorite)} className="p-1 hover:bg-white/80 rounded transition-colors ml-1">
                           <svg className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                        </button>
                        <button className="p-1 hover:bg-white/80 rounded text-slate-400 hover:text-slate-600 transition-colors"><ICONS.Download className="w-3.5 h-3.5" /></button>
                     </div>
                  </div>

                  <div className="flex flex-1 items-center justify-between min-h-0">
                     <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">TARGET ARTIFACT</span>
                        <div className="flex items-baseline gap-2">
                           <span className={`text-2xl font-black tracking-tighter ${isSuccess ? 'text-slate-900' : 'text-rose-900'}`}>
                              {isSuccess ? '1.2.6.0' : 'ERROR_LOG_24'}
                           </span>
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">IFWI_DMR_Ao_Rel</span>
                        </div>
                        <div className="mt-1.5">
                           <span className="text-[9px] font-bold text-slate-500 bg-white/40 px-1.5 py-0.5 rounded border border-slate-100">
                             Baseline: IFWI_DMR_Ao_Rel v24.12.0
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
               /* RUNNING STATE: Transformation Focus */
               <div className="p-3 pb-1 flex flex-col flex-1">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm border ${isUnifiedPatch ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                         {isUnifiedPatch ? 'UNIFIED PATCH' : 'IFWI BUILD'}
                      </span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ring-1 ring-inset bg-blue-50 text-blue-600 ring-blue-100 animate-pulse">
                         EXECUTING
                      </span>
                   </div>
                 </div>

                 <div className="flex items-center gap-8 flex-1">
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                       <span className="text-[7px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">FROM: BASELINE</span>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-700 truncate leading-none mb-1">IFWI_DMR_Ao_Rel</span>
                          <span className="text-[11px] font-black text-slate-900 mono tracking-tighter tabular-nums">v24.12.0</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-center justify-center shrink-0">
                       <div className="w-6 h-6 rounded-full border border-blue-100 flex items-center justify-center shadow-sm bg-blue-50 text-blue-500">
                         <ICONS.ChevronRight className="w-3.5 h-3.5 animate-bounce-x" />
                       </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                       <span className="text-[7px] font-black uppercase mb-0.5 tracking-widest text-brand">TO: TARGET</span>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold truncate leading-none mb-1 text-brand">IFWI_DMR_Ao_Rel</span>
                          <span className="text-[11px] font-black mono tracking-tighter tabular-nums text-brand">v25.1.0-RC</span>
                       </div>
                    </div>
                 </div>
               </div>
             )}

             {/* Footer: Dynamic Progress Bar */}
             <div className={`h-1.5 w-full bg-slate-50 mt-auto border-t overflow-hidden ${isCompleted ? 'border-transparent' : 'border-slate-100'}`}>
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${isSuccess ? 'bg-emerald-500 w-full' : isFailed ? 'bg-rose-500 w-full' : 'bg-blue-500 animate-indeterminate-progress'}`} 
                  style={!isRunning && !isCompleted ? { width: '0%' } : isRunning ? {} : { width: '100%' }}
                />
             </div>
          </div>

          {/* Execution Time Metrics */}
          <div className="bg-white p-4 py-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[115px] relative overflow-hidden group hover:border-slate-300 transition-colors">
             <div className="flex flex-col items-center flex-1 justify-center">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Execution Metrics</span>
                <span className={`text-[24px] font-black mono tracking-tight leading-none tabular-nums animate-in slide-in-from-bottom-1 ${isSuccess ? 'text-emerald-700' : isFailed ? 'text-rose-700' : 'text-slate-800'}`}>
                   {formatSeconds(buildSeconds)}
                </span>
             </div>
             
             <div className="flex items-center justify-between border-t border-slate-100 pt-2 pb-0.5 shrink-0">
                <div className="flex flex-col items-start">
                   <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1 tracking-widest">Job Start</span>
                   <span className="text-[10px] font-bold text-slate-600 leading-none mono tracking-tighter">12/17 14:35:00</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1 tracking-widest">Job Finish</span>
                   <span className={`text-[10px] font-bold leading-none mono tracking-tighter ${isCompleted ? 'text-slate-600' : 'text-brand italic animate-pulse'}`}>
                      {isCompleted ? '12/17 14:55:14' : 'EXECUTING...'}
                   </span>
                </div>
             </div>
          </div>
        </div>

        {/* Lower KPI Stats */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
          {stats.map((stat, i) => (
            <div key={i} className="flex-shrink-0 min-w-[145px] bg-white p-3 px-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:border-slate-300 hover:shadow-md">
              <div className="flex flex-col">
                <span className="text-[16px] font-black text-slate-800 tracking-tight leading-none mb-1">{stat.val}</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div ref={buildScrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar scroll-smooth">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div onClick={() => toggleBuildSection('settings')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3"><div className="w-1 h-3 bg-amber-500 rounded-full" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{isUnifiedPatch ? 'PATCH SETTINGS' : 'IFWI SETTINGS'}</span></div>
              <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedBuildSections.settings ? '' : 'rotate-90'}`} />
            </div>
            {!collapsedBuildSections.settings && (
               <div className="p-0 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 divide-x divide-slate-100">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SILICON FAMILY</span><span className="text-[12px] font-black text-slate-800">DMR-AP</span></div>
                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SILICON STEP</span><span className="text-[12px] font-black text-slate-800">AO</span></div>
                  </div>
               </div>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div onClick={() => toggleBuildSection('deps')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-1 h-3 bg-brand rounded-full" />
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{isUnifiedPatch ? 'PATCH DEPENDENCIES' : 'IFWI DEPENDENCIES'}</span>
                <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-black mono">{changedDepsCount}/{totalDeps}</span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={(e) => { e.stopPropagation(); setShowAllDeps(!showAllDeps); }} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded shadow-sm text-[9px] font-black text-slate-500 hover:text-brand transition-all uppercase tracking-widest">
                  <ICONS.Filter className="w-3 h-3" /> {showAllDeps ? 'Show Changes Only' : 'Show All Dependencies'}
                </button>
                <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedBuildSections.deps ? '' : 'rotate-90'}`} />
              </div>
            </div>
            {!collapsedBuildSections.deps && (
               <div className="overflow-x-auto animate-in fade-in duration-300">
                 <table className="w-full text-left text-[11px] border-collapse">
                   <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0">
                     <tr><th className="px-6 py-3">Ingredient</th><th className="px-6 py-3">Baseline</th><th className="px-6 py-3">Target</th><th className="px-6 py-3 text-right">Status</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {displayedDeps.map((dep, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-6 py-2.5 font-bold text-slate-700 truncate max-w-[200px]">Ingredient_{dep.id}</td>
                          <td className="px-6 py-2.5 mono text-slate-400 tabular-nums">{dep.version}</td>
                          <td className="px-6 py-2.5 mono text-brand font-bold tabular-nums">v25.1.0</td>
                          <td className="px-6 py-2.5 text-right">
                             {dep.isModified ? <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[9px] font-black uppercase tracking-tighter">Modified</span> : <span className="px-2 py-0.5 text-slate-300 text-[9px] font-black uppercase tracking-tighter">Unchanged</span>}
                          </td>
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
               <div className="p-10 bg-slate-50 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                  {isRunning ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Logs streaming soon</span>
                        <p className="text-[10px] text-slate-400 max-w-xs mt-1">Initializing persistent log backend stream...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-5">
                      <div className="w-12 h-12 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-400">
                        <ICONS.Terminal className="w-6 h-6" />
                      </div>
                      <button className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md">
                        <ICONS.Download className="w-3.5 h-3.5" /> DOWNLOAD FULL LOG ARCHIVE
                      </button>
                    </div>
                  )}
               </div>
            )}
          </section>
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
              <span>• RUN ID <span className="text-slate-600 mono font-black">507</span></span>
            </div>
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <aside className={`transition-all duration-300 border-r border-slate-200 bg-white flex flex-col shrink-0 z-10 ${isWorkflowSidebarCollapsed ? 'w-20' : 'w-[280px]'}`}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              {!isWorkflowSidebarCollapsed && <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">WORKFLOW STAGES <span className="text-slate-300 ml-1">3</span></h2>}
              <button onClick={() => setIsWorkflowSidebarCollapsed(!isWorkflowSidebarCollapsed)} className="p-1.5 hover:bg-slate-50 rounded text-slate-400">
                <svg className={`w-4 h-4 transition-transform ${isWorkflowSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-slate-50/20">
              {MOCK_WORKFLOW.map(stage => {
                const isStageActive = stage.steps.some(s => s.id === selectedStepId);
                return (
                  <div key={stage.id} className={`p-3 rounded-lg border transition-all ${isStageActive ? 'border-blue-200 bg-white shadow-sm ring-2 ring-blue-50/10' : 'border-slate-100 bg-white'}`}>
                    {!isWorkflowSidebarCollapsed && (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${stage.status === 'Success' ? 'bg-emerald-500' : (stage.status === 'In progress' ? 'bg-blue-500' : 'bg-slate-300')}`} />
                          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{stage.name}</h3>
                        </div>
                        <div className="space-y-1">
                          {stage.steps.map(step => (
                            <button key={step.id} onClick={() => setSelectedStepId(step.id)} className={`w-full text-left px-2.5 py-1.5 rounded border transition-all flex items-center justify-between ${selectedStepId === step.id ? 'bg-blue-50 border-blue-100 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}><span className="text-[10px] uppercase tracking-tight">{step.name}</span></button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
          <main className="flex-1 overflow-hidden relative bg-slate-50/30 px-10 py-6">
             {(selectedStepId === 'step1' || selectedStepId === 'step0') ? renderQuickBuildStepView() : <div className="p-20 text-center"><h1 className="text-slate-400 font-black tracking-widest uppercase">CONTENT UNAVAILABLE</h1></div>}
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
      <SidebarTier1 activeContext={nav.activeContext} onContextChange={(ctx) => setNav(p => ({ ...p, activeContext: ctx }))} />
      <SidebarTier2 
        activeContext={nav.activeContext} 
        activeProject={activeProject} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onProjectSelect={(p) => setNav(prev => ({ ...prev, activeProjectId: p.id }))} 
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
