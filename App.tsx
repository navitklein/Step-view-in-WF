
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppContextType, Project, NavigationContext, ContextState } from './types';
import { COLORS, ICONS, MOCK_INGREDIENTS, MOCK_RELEASES, MOCK_PROJECTS, MOCK_KNOBS, MOCK_STRAPS, MOCK_BUILD_DEPS, MOCK_WORKFLOW, Ingredient, Release, Knob } from './constants';
import SidebarTier1 from './components/SidebarTier1';
import SidebarTier2 from './components/SidebarTier2';
import Header from './components/Header';

type TestStepPhaseId = 'DISCOVERY' | 'REVIEW' | 'SUBMISSION' | 'EXECUTION' | 'RESULT' | 'DONE';
const TEST_PHASE_ORDER: TestStepPhaseId[] = ['DISCOVERY', 'REVIEW', 'SUBMISSION', 'EXECUTION', 'RESULT', 'DONE'];

type EdgeCaseId = 'NORMAL' | 'LONG_BASELINE' | 'LONG_TARGET' | 'LONG_BOTH';

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

  const [selectedStepId, setSelectedStepId] = useState<string>('step2');
  const [currentTestPhase, setCurrentTestPhase] = useState<TestStepPhaseId>('EXECUTION');
  const [edgeCaseId, setEdgeCaseId] = useState<EdgeCaseId>('NORMAL');
  const [isStateMenuOpen, setIsStateMenuOpen] = useState(false);
  const [isWorkflowSidebarCollapsed, setIsWorkflowSidebarCollapsed] = useState(false);
  
  const [showAllDeps, setShowAllDeps] = useState(false);
  const displayedDeps = useMemo(() => {
    return showAllDeps ? MOCK_BUILD_DEPS : MOCK_BUILD_DEPS.filter(d => d.isModified);
  }, [showAllDeps]);

  const [resOutcome, setResOutcome] = useState<'PASSED' | 'FAILED' | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [buildSeconds, setBuildSeconds] = useState(1214);
  const [resolutionReason, setResolutionReason] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const stateMenuRef = useRef<HTMLDivElement>(null);

  const [collapsedBuildSections, setCollapsedBuildSections] = useState<Record<string, boolean>>({
    settings: false,
    deps: false,
  });

  const [collapsedTestSections, setCollapsedTestSections] = useState<Record<string, boolean>>({
    settings: false,
    testlines: false,
    matrix: false,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stateMenuRef.current && !stateMenuRef.current.contains(event.target as Node)) {
        setIsStateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let interval: any;
    const isBuildExecution = activeTab === 'Quick Builds' && (currentTestPhase !== 'DONE');
    const isTestExecution = currentTestPhase === 'EXECUTION';

    if (isBuildExecution || isTestExecution) {
      interval = setInterval(() => {
        setBuildSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentTestPhase, activeTab]);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  };

  const cycleBuildState = () => {
    if (currentTestPhase !== 'DONE') {
      setCurrentTestPhase('DONE');
      setResOutcome('PASSED');
    } else if (resOutcome === 'PASSED') {
      setResOutcome('FAILED');
    } else {
      setCurrentTestPhase('EXECUTION');
      setResOutcome(null);
    }
  };

  const cycleEdgeCase = () => {
    const order: EdgeCaseId[] = ['NORMAL', 'LONG_BASELINE', 'LONG_TARGET', 'LONG_BOTH'];
    const currentIdx = order.indexOf(edgeCaseId);
    setEdgeCaseId(order[(currentIdx + 1) % order.length]);
  };

  const cycleDemoPhase = () => {
    if (activeTab === 'Quick Builds') {
      cycleBuildState();
      return;
    }
    const nextIdx = (TEST_PHASE_ORDER.indexOf(currentTestPhase) + 1) % TEST_PHASE_ORDER.length;
    setCurrentTestPhase(TEST_PHASE_ORDER[nextIdx]);
    if (TEST_PHASE_ORDER[nextIdx] === 'DONE') {
      setResOutcome('PASSED');
    } else {
      setResOutcome(null);
    }
  };

  // 90 char generator
  const generate90Chars = (prefix: string) => {
    const base = prefix;
    const filler = "X".repeat(Math.max(0, 90 - base.length));
    return base + filler;
  };

  const TruncatedText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => (
    <div className={`relative group cursor-help truncate max-w-full ${className}`} title={text}>
      {text}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-slate-900 text-white text-[10px] font-medium p-2 rounded shadow-xl max-w-xs break-all leading-relaxed ring-1 ring-white/10">
          {text}
        </div>
      </div>
    </div>
  );

  const renderQuickBuildStepView = () => {
    const isCompleted = currentTestPhase === 'DONE';
    const isSuccess = isCompleted && resOutcome === 'PASSED';
    const isFailed = isCompleted && resOutcome === 'FAILED';
    const isRunning = !isCompleted;
    const isUnifiedPatch = selectedStepId === 'step0';

    const cardBg = isSuccess ? 'bg-emerald-50/60' : isFailed ? 'bg-rose-50/60' : 'bg-blue-50/60';
    const statusBarColor = isSuccess ? 'bg-emerald-600' : isFailed ? 'bg-rose-600' : 'bg-brand';

    const baselineName = (edgeCaseId === 'LONG_BASELINE' || edgeCaseId === 'LONG_BOTH')
      ? generate90Chars("UP_DMR_AO_REL_STABLE_BUILD_ENVIRONMENT_ARCHIVE_LONG_ID_IDENTIFIER_")
      : "UP_DMR_AO_REL";

    const targetName = (edgeCaseId === 'LONG_TARGET' || edgeCaseId === 'LONG_BOTH')
      ? generate90Chars("Unified_pathc_DMR_A0_STAGING_ENVIRONMENT_STABLE_RELEASE_v25_1_0_RC_")
      : "Unified_pathc_DMR_A0_RC";

    const kpis = isUnifiedPatch 
      ? [
          { label: 'Dependencies Changes', val: `${MOCK_BUILD_DEPS.filter(d => d.isModified).length}/${MOCK_BUILD_DEPS.length}` },
          { label: 'Package Size', val: '4KB' }
        ]
      : [
          { label: 'Dep. Changes', val: `${MOCK_BUILD_DEPS.filter(d => d.isModified).length}/${MOCK_BUILD_DEPS.length}` },
          { label: 'Package Size', val: '32MB' },
          { label: 'Complexity', val: 'High' }
        ];

    return (
      <div className="flex flex-col space-y-3 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-500 h-full overflow-hidden relative">
        <div className="flex items-center justify-between shrink-0 mb-0.5">
          <div className="flex items-center gap-4">
             <h1 className="text-[18px] font-black text-slate-800 tracking-tight uppercase shrink-0">
               {isUnifiedPatch ? "UNIFIED PATCH EXECUTION" : "IFWI BUILD EXECUTION"}
             </h1>
             <div className="h-4 w-[1px] bg-slate-200 mx-1" />
             <div className="flex items-center gap-1.5">
               <button onClick={cycleDemoPhase} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-black text-slate-600 uppercase transition-all flex items-center gap-1.5 group">
                  Cycle State <ICONS.ChevronRight className="w-2 h-2 group-hover:translate-x-0.5 transition-transform" />
               </button>
               <button onClick={cycleEdgeCase} className="px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-[9px] font-black text-blue-600 uppercase transition-all flex items-center gap-1.5 group">
                  Edge Case: {edgeCaseId} <ICONS.Filter className="w-2.5 h-2.5" />
               </button>
             </div>
             {copyFeedback && (
               <div className="px-2 py-0.5 bg-slate-800 text-white text-[9px] font-black uppercase rounded animate-in fade-in slide-in-from-left-1 shadow-sm">
                 Copied {copyFeedback}
               </div>
             )}
          </div>

          {/* Page Level CTAs */}
          <div className="flex items-center gap-2">
            {isSuccess && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                <button 
                  onClick={() => handleTabChange('Releases')}
                  className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded shadow-sm text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  <ICONS.ExternalLink className="w-3.5 h-3.5" /> GO TO RELEASE VIEW
                </button>
                <button className="flex items-center gap-2 px-4 py-1.5 bg-brand text-white rounded shadow-sm text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                  <ICONS.Download className="w-3.5 h-3.5" /> DOWNLOAD PACKAGE
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-10 gap-3 shrink-0">
          <div className={`col-span-7 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[110px] relative overflow-hidden transition-all duration-500 ${cardBg}`}>
             <div className="flex-1 p-3.5 px-7 flex flex-col min-h-0">
               {isSuccess ? (
                 <div className="flex items-start justify-between animate-in zoom-in-95 duration-500">
                    <div className="flex flex-col min-w-0 flex-1">
                       <span className="text-[7px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-0.5 leading-none">TARGET</span>
                       <TruncatedText text={targetName} className="text-[20px] font-black text-slate-800 leading-none mb-1 uppercase tracking-tight" />
                       <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-emerald-700 mono tabular-nums uppercase whitespace-nowrap">v25.1.0-RC // Release ID: 1166</span>
                          <button onClick={() => copyToClipboard('1166', 'Release ID')} className="p-0.5 text-emerald-600/40 hover:text-emerald-700 transition-colors"><ICONS.Copy className="w-3 h-3"/></button>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-0.5 shrink-0 -mt-1.5 -mr-3">
                       <button onClick={() => setIsFavorite(!isFavorite)} className={`p-2 rounded-full transition-all hover:bg-black/5 ${isFavorite ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`} title="Favorite Release">
                          <ICONS.Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                       </button>
                       <button onClick={() => handleTabChange('Releases')} className="p-2 rounded-full text-slate-400 hover:text-brand hover:bg-black/5 transition-all" title="Go to Release View">
                          <ICONS.ExternalLink className="w-5 h-5" />
                       </button>
                       <button className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-black/5 transition-all" title="Download Archive">
                          <ICONS.Download className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between gap-4 relative flex-1 min-w-0">
                    <div className="flex flex-col flex-1 min-w-0">
                       <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none whitespace-nowrap">BASELINE</span>
                       <TruncatedText text={baselineName} className="text-[11px] font-bold text-slate-800 uppercase" />
                       <div className="flex items-center gap-1.5">
                         <span className="text-[10px] font-medium text-slate-500 mono tabular-nums truncate whitespace-nowrap">v24.12.0 // ID: 1016</span>
                         <button onClick={() => copyToClipboard('1016', 'Baseline ID')} className="p-0.5 text-slate-300 hover:text-blue-600 transition-all rounded hover:bg-black/5"><ICONS.Copy className="w-2.5 h-2.5" /></button>
                       </div>
                    </div>
                    <div className="flex items-center justify-center shrink-0 px-4 opacity-10">
                       <svg className="w-10 h-4 text-slate-900" viewBox="0 0 24 12" fill="none"><path d="M1 6H23M23 6L18 1M23 6L18 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div className="flex flex-col flex-1 items-end text-right min-w-0">
                       <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none whitespace-nowrap">TARGET</span>
                       <TruncatedText text={targetName} className="text-[11px] font-black text-brand uppercase" />
                       <div className="flex items-center gap-1.5 justify-end">
                         <span className="text-[10px] font-bold text-brand mono tabular-nums truncate uppercase">v25.1.0-RC</span>
                       </div>
                    </div>
                 </div>
               )}
             </div>

             <div className="flex items-center justify-between border-t border-black/[0.08] py-2.5 px-7 bg-transparent shrink-0">
                <div className="flex items-center">
                   <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-white shadow-sm transition-all duration-300 ${isSuccess ? 'bg-emerald-600' : isFailed ? 'bg-rose-600' : 'bg-brand'} ${isRunning ? 'animate-pulse' : ''} leading-none flex items-center h-4`}>
                      {isRunning ? 'In Progress' : isSuccess ? 'Success' : 'Failure'}
                   </div>
                </div>
                {isSuccess && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-1 duration-300 min-w-0 overflow-hidden">
                     <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none shrink-0">BASELINE:</span>
                     <TruncatedText text={`${baselineName} v24.12.0 // ID: 1016`} className="text-[10px] font-bold text-slate-500 mono opacity-70 leading-none" />
                  </div>
                )}
             </div>

             <div className="h-1.5 w-full bg-slate-900/5 overflow-hidden shrink-0">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${statusBarColor} ${isRunning ? 'animate-indeterminate-progress' : ''}`} 
                  style={isRunning ? {} : { width: '100%' }}
                />
             </div>
          </div>

          <div className="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[110px] relative overflow-hidden group hover:border-slate-300 transition-colors">
             <div className="flex flex-col items-center flex-1 justify-center mt-0.5 px-6">
                <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em] mb-1 leading-none">EXECUTION TIME</span>
                <span className="text-2xl font-black mono tracking-tight leading-none tabular-nums text-slate-800 drop-shadow-sm">
                   {formatSeconds(buildSeconds)}
                </span>
             </div>
             <div className="flex items-center justify-around border-t border-slate-50 mt-auto bg-slate-50/40 py-2.5 px-6 shrink-0">
                <div className="flex items-center gap-1 flex-col flex-1">
                   <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5 tracking-widest">STARTED</span>
                   <span className="text-[10px] font-bold text-slate-600 leading-none mono tabular-nums whitespace-nowrap">12/17 14:35:00</span>
                </div>
                <div className="h-5 w-[1px] bg-slate-200 mx-2 shrink-0" />
                <div className="flex items-center gap-1 flex-col flex-1 min-w-[80px]">
                   <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5 tracking-widest">FINISHED</span>
                   <span className="text-[10px] font-bold leading-none mono tabular-nums text-slate-600 whitespace-nowrap">
                      {isCompleted ? '12/17 14:55:14' : '--:--:--'}
                   </span>
                </div>
             </div>
             <div className="h-1.5 w-full bg-slate-50 border-t border-slate-100 shrink-0" />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar shrink-0">
          {kpis.map((stat, i) => (
            <div key={i} className="flex-shrink-0 min-w-[140px] bg-white p-2.5 px-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:border-slate-300">
              <div className="flex flex-col">
                <span className="text-[15px] font-black text-slate-800 tracking-tight leading-none mb-0.5">{stat.val}</span>
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar scroll-smooth">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div onClick={() => toggleBuildSection('settings')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3"><div className="w-1 h-3 bg-amber-500 rounded-full" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{isUnifiedPatch ? 'PATCH SETTINGS' : 'IFWI BUILD SETTINGS'}</span></div>
              <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedBuildSections.settings ? '' : 'rotate-90'}`} />
            </div>
            {!collapsedBuildSections.settings && (
               <div className="p-0 animate-in slide-in-from-top-2 duration-300">
                  {isUnifiedPatch ? (
                    <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                      <div className="flex flex-col divide-y divide-slate-100">
                        <div className="flex items-center justify-between px-6 py-2.5"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Silicon</span><span className="text-[12px] font-black text-slate-800 uppercase mono">DMR-AP</span></div>
                        <div className="flex items-center justify-between px-6 py-2.5"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SoC Signing</span><span className="text-[12px] font-black text-emerald-600 uppercase mono">Enabled</span></div>
                        <div className="flex items-center justify-between px-6 py-2.5"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SoC Encryption</span><span className="text-[12px] font-black text-emerald-600 uppercase mono">Enabled</span></div>
                      </div>
                      <div className="flex flex-col divide-y divide-slate-100">
                        <div className="flex items-center justify-between px-6 py-2.5"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step</span><span className="text-[12px] font-black text-slate-800 uppercase mono">A0</span></div>
                        <div className="flex items-center justify-between px-6 py-2.5"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FIT Signing</span><span className="text-[12px] font-black text-rose-600 uppercase mono">Disabled</span></div>
                        <div className="flex items-center justify-between px-6 py-2.5"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FIT Encryption</span><span className="text-[12px] font-black text-emerald-600 uppercase mono">Enabled</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 divide-x divide-slate-100">
                      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SILICON FAMILY</span><span className="text-[12px] font-black text-slate-800 uppercase mono">DMR-AP</span></div>
                      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SILICON STEP</span><span className="text-[12px] font-black text-slate-800 uppercase mono">AO</span></div>
                    </div>
                  )}
               </div>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div onClick={() => toggleBuildSection('deps')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-1 h-3 bg-brand rounded-full" />
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{isUnifiedPatch ? 'PATCH DEPENDENCIES' : 'IFWI DEPENDENCIES'}</span>
                <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-black mono">{MOCK_BUILD_DEPS.filter(d => d.isModified).length}/{MOCK_BUILD_DEPS.length}</span>
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
                          <td className="px-6 py-2.5 font-bold text-slate-700 truncate max-w-[200px]">{isUnifiedPatch ? 'Unified_' : ''}Ingredient_{dep.id}</td>
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
        </div>
      </div>
    );
  };

  const renderTestStepView = () => {
    const isRunning = currentTestPhase === 'EXECUTION';
    const isCompleted = currentTestPhase === 'DONE';
    
    return (
      <div className="flex flex-col space-y-6 animate-in fade-in duration-500 h-full overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <h1 className="text-[18px] font-black text-slate-800 tracking-tight uppercase">VALIDATION TEST EXECUTION</h1>
          <div className="flex items-center gap-2">
            <button onClick={cycleDemoPhase} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-black text-slate-600 uppercase transition-all">
               Cycle Test State
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 shrink-0">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Test Progress</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">45%</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase">Passed</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: '45%' }} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Test Cases</span>
            <span className="text-3xl font-black text-slate-800">1,204</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">34 Remaining</span>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estimated Finish</span>
            <span className="text-3xl font-black text-slate-800">24m 12s</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Average 1s/test</span>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Test Execution Console</span>
            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${isRunning ? 'bg-blue-600 animate-pulse' : 'bg-slate-600'}`}>
              {isRunning ? 'RUNNING' : 'IDLE'}
            </div>
          </div>
          <div className="flex-1 bg-slate-900 p-4 font-mono text-[11px] text-emerald-400 overflow-y-auto custom-scrollbar">
            <div className="mb-1 text-slate-500">[{new Date().toLocaleTimeString()}] Initializing test environment...</div>
            <div className="mb-1 text-slate-500">[{new Date().toLocaleTimeString()}] Loading dependencies...</div>
            <div className="mb-1 text-emerald-400">[{new Date().toLocaleTimeString()}] SUCCESS: Environment ready.</div>
            <div className="mb-1 text-blue-400">[{new Date().toLocaleTimeString()}] INFO: Running Test Suite: Performance_Validation_V2</div>
            <div className="mb-1 text-emerald-400">[{new Date().toLocaleTimeString()}] PASS: test_case_001_initial_boot</div>
            <div className="mb-1 text-emerald-400">[{new Date().toLocaleTimeString()}] PASS: test_case_002_memory_mapping</div>
            {isRunning && (
               <div className="animate-pulse text-blue-300">[{new Date().toLocaleTimeString()}] RUNNING: test_case_003_stress_load...</div>
            )}
            {isCompleted && (
               <div className="text-emerald-400 font-bold mt-4 tracking-widest">--- TEST SUITE FINISHED ---</div>
            )}
          </div>
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
              <span>TRIGGERED BY <span className="text-slate-600 font-black uppercase">JD Dayan, Roni</span></span>
              <span>• RUN ID <span className="text-slate-600 mono font-black">507</span></span>
            </div>
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <aside className={`transition-all duration-300 border-r border-slate-200 bg-white flex flex-col shrink-0 z-10 ${isWorkflowSidebarCollapsed ? 'w-20' : 'w-[280px]'}`}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              {!isWorkflowSidebarCollapsed && <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">WORKFLOW STAGES <span className="text-slate-300 ml-1">3</span></h2>}
              <button onClick={() => setIsWorkflowSidebarCollapsed(!isWorkflowSidebarCollapsed)} className="p-1.5 hover:bg-slate-50 rounded text-slate-400">
                <svg className={`w-4 h-4 transition-transform ${isWorkflowSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
                </svg>
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
                            <button key={step.id} onClick={() => { setSelectedStepId(step.id); if(step.id === 'step0' || step.id === 'step1') setCurrentTestPhase('EXECUTION'); }} className={`w-full text-left px-2.5 py-1.5 rounded border transition-all flex items-center justify-between ${selectedStepId === step.id ? 'bg-blue-50 border-blue-100 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}><span className="text-[10px] uppercase tracking-tight">{step.name}</span></button>
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
             {(selectedStepId === 'step1' || selectedStepId === 'step0') ? renderQuickBuildStepView() : (selectedStepId === 'step2' || selectedStepId === 'step3') ? renderTestStepView() : <div className="p-20 text-center"><h1 className="text-slate-400 font-black tracking-widest uppercase">CONTENT UNAVAILABLE</h1></div>}
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

  const toggleBuildSection = (section: string) => setCollapsedBuildSections(prev => ({ ...prev, [section]: !prev[section] }));
  const toggleTestSection = (section: string) => setCollapsedTestSections(prev => ({ ...prev, [section]: !prev[section] }));

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
