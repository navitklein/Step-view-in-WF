
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppContextType, Project, NavigationContext, ContextState } from './types';
import { COLORS, ICONS, MOCK_INGREDIENTS, MOCK_RELEASES, MOCK_PROJECTS, MOCK_KNOBS, MOCK_STRAPS, MOCK_BUILD_DEPS, MOCK_WORKFLOW, Ingredient, Release, Knob } from './constants';
import SidebarTier1 from './components/SidebarTier1';
import SidebarTier2 from './components/SidebarTier2';
import Header from './components/Header';

type TestStepPhaseId = 'DISCOVERY' | 'REVIEW' | 'SUBMISSION' | 'EXECUTION' | 'RESULT' | 'DONE';

const TEST_PHASE_ORDER: TestStepPhaseId[] = ['DISCOVERY', 'REVIEW', 'SUBMISSION', 'EXECUTION', 'RESULT', 'DONE'];

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
  const [isStateMenuOpen, setIsStateMenuOpen] = useState(false);
  const [isWorkflowSidebarCollapsed, setIsWorkflowSidebarCollapsed] = useState(false);
  
  const [showAllDeps, setShowAllDeps] = useState(false);
  const [resOutcome, setResOutcome] = useState<'PASSED' | 'FAILED' | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [buildSeconds, setBuildSeconds] = useState(1214);
  const [resolutionReason, setResolutionReason] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const stateMenuRef = useRef<HTMLDivElement>(null);
  const buildScrollRef = useRef<HTMLDivElement>(null);

  const [collapsedBuildSections, setCollapsedBuildSections] = useState<Record<string, boolean>>({
    settings: false,
    deps: false,
  });

  const [collapsedTestSections, setCollapsedTestSections] = useState<Record<string, boolean>>({
    settings: false,
    testlines: false,
    matrix: false,
  });

  const toggleBuildSection = (section: string) => {
    setCollapsedBuildSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTestSection = (section: string) => {
    setCollapsedTestSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const displayedDeps = useMemo(() => {
    return showAllDeps ? MOCK_BUILD_DEPS : MOCK_BUILD_DEPS.filter(d => d.isModified);
  }, [showAllDeps]);

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

  const renderTestStepView = () => {
    const currentIndex = TEST_PHASE_ORDER.indexOf(currentTestPhase);
    const isDiscovery = currentTestPhase === 'DISCOVERY';
    const isReview = currentTestPhase === 'REVIEW';
    const isSubmission = currentTestPhase === 'SUBMISSION';
    const isExecution = currentTestPhase === 'EXECUTION';
    const isResult = currentTestPhase === 'RESULT';
    const isCompleted = currentTestPhase === 'DONE';

    const kpis = (() => {
      if (isReview) return [
        { label: 'DISCOVERED', val: '450', color: 'slate' },
        { label: 'SELECTED', val: '442', color: 'blue' },
        { label: 'EXCLUDED', val: '8', color: 'amber' },
      ];
      if (isSubmission) return [
        { label: 'DISCOVERED', val: '450', color: 'slate' },
        { label: 'SUBMITTED', val: '442/450', color: 'blue' },
      ];
      if (isExecution || isResult || isCompleted) return [
        { label: 'DISCOVERED', val: '450', color: 'slate' },
        { label: 'SUBMITTED', val: '450', color: 'slate' },
        { label: 'COMPLETED', val: '320', color: 'blue' },
        { label: 'RUNNING', val: '12', color: 'purple' },
        { label: 'PASSED', val: '312', color: 'emerald' },
        { label: 'FAILED', val: '8', color: 'rose' },
        { label: 'PENDING', val: '118', color: 'slate' },
        { label: 'PASS RATE', val: '97.5%', color: 'brand' },
      ];
      return [];
    })();

    return (
      <div className="flex flex-col space-y-4 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-500 h-full overflow-hidden relative">
        <div className="flex items-center justify-between shrink-0 mb-1">
          <div className="flex items-center gap-4">
             <h1 className="text-[18px] font-black text-slate-800 tracking-tight uppercase shrink-0">VAL_DMR_AO_POWER_ON</h1>
             <div className="h-4 w-[1px] bg-slate-200 mx-1" />
             <div className="flex items-center gap-2">
                <button onClick={cycleDemoPhase} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-black text-slate-600 uppercase transition-all flex items-center gap-1.5 group">
                   Cycle State <ICONS.ChevronRight className="w-2 h-2 group-hover:translate-x-0.5 transition-transform" />
                </button>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             {!isCompleted && (
                <button className="flex items-center gap-2 px-4 py-1.5 bg-slate-200 text-slate-600 rounded shadow-sm text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 hover:text-rose-600 transition-all">
                  <ICONS.MoreHorizontal className="w-3.5 h-3.5" /> ABORT STEP
                </button>
             )}
             {isReview && (
                <button onClick={cycleDemoPhase} className="flex items-center gap-2 px-4 py-1.5 bg-brand text-white rounded shadow-sm text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                   <ICONS.Terminal className="w-3.5 h-3.5" /> SUBMIT TO NGA
                </button>
             )}
             {isExecution && (
                <button className="flex items-center gap-2 px-4 py-1.5 bg-brand text-white rounded shadow-sm text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                   <ICONS.ExternalLink className="w-3.5 h-3.5" /> VIEW LIVE LOGS
                </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[115px] relative overflow-hidden group hover:border-slate-300 transition-colors">
             <div className="p-4 flex flex-col justify-center gap-2 h-full">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STEP STATE</span>
                   <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                         {TEST_PHASE_ORDER.map((phase, i) => (
                           <div key={phase} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= currentIndex ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]' : 'bg-slate-200'}`} />
                         ))}
                      </div>
                      <div className="relative" ref={stateMenuRef}>
                        <button onClick={() => setIsStateMenuOpen(!isStateMenuOpen)} className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors">
                          {currentTestPhase}
                        </button>
                        {isStateMenuOpen && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                            <p className="px-4 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">LIFECYCLE</p>
                            {TEST_PHASE_ORDER.map((phase) => (
                              <button key={phase} onClick={() => { setCurrentTestPhase(phase); setIsStateMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-[11px] font-black uppercase flex items-center gap-3 hover:bg-slate-50 transition-colors ${currentTestPhase === phase ? 'text-blue-600' : 'text-slate-500'}`}>
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${currentTestPhase === phase ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`}>
                                  {currentTestPhase === phase && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                </div>
                                {phase}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                   </div>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NGA CONNECTION</span>
                   <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 font-black uppercase">ONLINE</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-blue-500 transition-all duration-1000 ${(isDiscovery || isSubmission) ? 'animate-indeterminate-progress' : ''}`} style={{ width: (isExecution || isResult || isCompleted) ? '78%' : '15%' }} />
                   </div>
                   <span className="text-[10px] font-black text-blue-600 tabular-nums">{(isExecution || isResult || isCompleted) ? '78%' : '--%'}</span>
                </div>
             </div>
          </div>

          <div className="bg-white p-4 py-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[115px] relative overflow-hidden group hover:border-slate-300 transition-colors">
             <div className="flex flex-col items-center flex-1 justify-center">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Total Duration</span>
                <span className={`text-[24px] font-black mono tracking-tight leading-none tabular-nums animate-in slide-in-from-bottom-1 ${isExecution ? 'text-slate-800' : (resOutcome === 'PASSED' ? 'text-emerald-700' : 'text-rose-700')}`}>
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
                   <span className={`text-[10px] font-bold leading-none mono tracking-tighter ${(isResult || isCompleted) ? 'text-slate-600' : 'text-brand italic animate-pulse'}`}>
                      {(isResult || isCompleted) ? '12/17 14:55:14' : 'PENDING...'}
                   </span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
           {kpis.length > 0 && (
             <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar shrink-0">
               {kpis.map((stat, i) => (
                 <div key={i} className="flex-shrink-0 min-w-[120px] bg-white p-3 px-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:border-slate-300">
                   <div className="flex flex-col">
                     <span className="text-[16px] font-black text-slate-800 tracking-tight leading-none mb-1">{stat.val}</span>
                     <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{stat.label}</span>
                   </div>
                 </div>
               ))}
             </div>
           )}

           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
              {isDiscovery && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center space-y-4 animate-in fade-in duration-700">
                   <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse border border-blue-100"><ICONS.Search className="w-8 h-8" /></div>
                   <div className="max-w-md mx-auto"><h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-2">Discovery Scanning</h3><p className="text-[12px] text-slate-500 leading-relaxed font-medium">We're currently scanning for available tests. This process may take a moment to complete. Please wait while we prepare your tests...</p></div>
                </div>
              )}

              {isReview && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0 border border-blue-200"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                  <div className="flex flex-col space-y-1"><span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">BEFORE SUBMITTING TESTS</span><ul className="text-[11px] text-blue-600/80 font-bold space-y-0.5 list-disc pl-4"><li>Review each test's configuration and properties</li><li>Select multiple test rows to bulk edit settings</li><li>Click on test row menu to edit individual test settings</li></ul></div>
                </div>
              )}

              {isSubmission && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center space-y-4 animate-in fade-in duration-700">
                   <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto border border-blue-100"><ICONS.Download className="w-8 h-8 rotate-180 animate-bounce" /></div>
                   <div className="max-w-md mx-auto"><h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-2">Dispatching to NGA</h3><p className="text-[12px] text-slate-500 leading-relaxed font-medium">We're submitting your tests to the NGA. This process may take anywhere from a few seconds to ~15 minutes. Please wait while we prepare your tests...</p></div>
                </div>
              )}

              {isResult && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in zoom-in-95 mb-4">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30"><h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Final Engineering Resolution</h3><p className="text-[11px] text-slate-500 font-medium">Please review results and provide a final resolution decision.</p></div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => setResOutcome('PASSED')} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${resOutcome === 'PASSED' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md ring-4 ring-emerald-500/10' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}><svg className={`w-8 h-8 transition-transform ${resOutcome === 'PASSED' ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="text-[12px] font-black uppercase tracking-widest">PASS RESULT</span></button>
                       <button onClick={() => setResOutcome('FAILED')} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${resOutcome === 'FAILED' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-md ring-4 ring-rose-500/10' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}><svg className={`w-8 h-8 transition-transform ${resOutcome === 'FAILED' ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="text-[12px] font-black uppercase tracking-widest">FAIL RESULT</span></button>
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">RESOLUTION REASON (MANDATORY)</label><textarea value={resolutionReason} onChange={(e) => setResolutionReason(e.target.value)} placeholder="Engineering justification..." className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-inner" /></div>
                    <div className="flex justify-end"><button disabled={!resOutcome || !resolutionReason.trim()} onClick={cycleDemoPhase} className={`px-8 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${resOutcome && resolutionReason.trim() ? 'bg-brand text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>SUBMIT RESOLUTION</button></div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div onClick={() => toggleTestSection('settings')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3"><div className="w-1 h-3 bg-amber-500 rounded-full" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">TEST SETTINGS</span></div>
                    <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedTestSections.settings ? '' : 'rotate-90'}`} />
                  </div>
                  {!collapsedTestSections.settings && (
                    <div className="p-0 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 divide-x divide-slate-100">
                        <div className="flex flex-col">
                           <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SILICON</span><span className="text-[12px] font-black text-slate-800 mono uppercase">DMR-AP</span></div>
                           <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STEP</span><span className="text-[12px] font-black text-slate-800 mono uppercase">AO</span></div>
                           <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50 lg:border-b-0"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SOC SIGNING</span><span className="text-[12px] font-black text-slate-400 italic">None</span></div>
                        </div>
                        <div className="flex flex-col">
                           <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FIT1 SIGNING</span><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase tracking-widest">ENABLED</span></div>
                           <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SOC ENCRYPTION</span><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase tracking-widest">ENABLED</span></div>
                           <div className="flex items-center justify-between px-6 py-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FIT ENCRYPTION</span><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase tracking-widest">ENABLED</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {(isReview || isExecution || isResult || isCompleted) && (
                  <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div onClick={() => toggleTestSection('testlines')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3"><div className="w-1 h-3 bg-brand rounded-full" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{isReview ? 'DISCOVERED TESTS' : 'TEST LINES'}</span></div>
                      <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedTestSections.testlines ? '' : 'rotate-90'}`} />
                    </div>
                    {!collapsedTestSections.testlines && (
                      <div className="overflow-x-auto animate-in fade-in duration-300">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                            <tr><th className="px-6 py-3">Case ID</th><th className="px-6 py-3">SUT</th><th className="px-6 py-3">Time</th><th className="px-6 py-3 text-right">Outcome</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {[1,2,3,4,5,6,7,8].map(i => (
                              <tr key={i} className="hover:bg-slate-50/50 group transition-colors">
                                <td className="px-6 py-2.5 font-bold text-slate-700 mono">VAL_TC_PTL_{i+100}</td>
                                <td className="px-6 py-2.5 text-slate-500 mono uppercase">SUT_IDC_{i}</td>
                                <td className="px-6 py-2.5 text-slate-400 tabular-nums mono">{isExecution || isResult || isCompleted ? `00:15:${i}0` : '--:--'}</td>
                                <td className="px-6 py-2.5 text-right">
                                  <span className={`text-[9px] font-black uppercase tracking-tighter ${i % 5 === 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {isReview ? 'READY' : (i % 5 === 0 ? 'FAILED' : 'PASSED')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                )}

                {(isExecution || isResult || isCompleted) && (
                  <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div onClick={() => toggleTestSection('matrix')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3"><div className="w-1 h-3 bg-purple-500 rounded-full" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">HEAT MAP MATRIX</span></div>
                      <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedTestSections.matrix ? '' : 'rotate-90'}`} />
                    </div>
                    {!collapsedTestSections.matrix && (
                      <div className="p-6 animate-in slide-in-from-top-2 duration-300">
                         <div className="flex flex-wrap gap-1.5 justify-center">
                            {Array.from({length: 450}).map((_, i) => (
                              <div key={i} title={`Test Case ${i+1}`} className={`w-3.5 h-3.5 rounded-sm shadow-sm hover:scale-125 transition-transform cursor-crosshair border border-white/20 ${i < 320 ? (i % 30 === 0 ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-slate-100'}`} />
                            ))}
                         </div>
                         <div className="mt-6 flex items-center justify-center gap-6">
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Passed</span></div>
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-rose-500" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Failed</span></div>
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-slate-200" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pending</span></div>
                         </div>
                      </div>
                    )}
                  </section>
                )}
              </div>

              {isCompleted && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-12 text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center border-4 border-emerald-200 mx-auto shadow-lg"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                  <div className="max-w-md mx-auto"><h3 className="text-[16px] font-black text-emerald-800 uppercase tracking-widest">Validation Success</h3><p className="text-[12px] text-emerald-700/70 font-bold leading-relaxed">The step has been successfully archived. Engineering confirmed outcome: PASSED.</p><button onClick={() => handleTabChange('Workflows')} className="mt-6 px-8 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 text-[11px] font-black uppercase tracking-widest">BACK TO WORKFLOW</button></div>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  const renderQuickBuildStepView = () => {
    const isCompleted = currentTestPhase === 'DONE';
    const isSuccess = isCompleted && resOutcome === 'PASSED';
    const isFailed = isCompleted && resOutcome === 'FAILED';
    const isRunning = !isCompleted;

    const cardBg = isSuccess ? 'bg-emerald-50/60' : isFailed ? 'bg-rose-50/60' : 'bg-blue-50/60';
    const statusBarColor = isSuccess ? 'bg-emerald-600' : isFailed ? 'bg-rose-600' : 'bg-brand';

    // 90 char target name: "Unified_pathc_DMR_A0" + 70 additional chars
    const targetName = selectedStepId === 'step0' 
      ? 'Unified_pathc_DMR_A0_BUILD_ENV_TARGET_RELEASE_v25_1_0_RC_VALIDATION_ENGINEERING_DEVOPS_CENTER'
      : 'IFWI_DMR_AO_REL';

    // Baseline prefix override
    const baselinePrefix = selectedStepId === 'step0' ? 'UP' : 'IFWI';

    return (
      <div className="flex flex-col space-y-3 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-500 h-full overflow-hidden relative">
        <div className="flex items-center justify-between shrink-0 mb-0.5">
          <div className="flex items-center gap-4">
             <h1 className="text-[18px] font-black text-slate-800 tracking-tight uppercase shrink-0">
               {selectedStepId === 'step0' ? "UNIFIED PATCH EXECUTION" : "IFWI BUILD EXECUTION"}
             </h1>
             <div className="h-4 w-[1px] bg-slate-200 mx-1" />
             <button onClick={cycleDemoPhase} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-black text-slate-600 uppercase transition-all flex items-center gap-1.5 group">
                Cycle State <ICONS.ChevronRight className="w-2 h-2 group-hover:translate-x-0.5 transition-transform" />
             </button>
             {copyFeedback && (
               <div className="px-2 py-0.5 bg-slate-800 text-white text-[9px] font-black uppercase rounded animate-in fade-in slide-in-from-left-1 shadow-sm">
                 Copied {copyFeedback}
               </div>
             )}
          </div>
        </div>

        <div className="grid grid-cols-10 gap-3 shrink-0">
          {/* High Density Transformation Card - col-span-7 */}
          <div className={`col-span-7 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[110px] relative overflow-hidden transition-all duration-500 ${cardBg}`}>
             {/* Unified Body Slot */}
             <div className="flex-1 p-3.5 px-7 flex flex-col min-h-0">
               {isSuccess ? (
                 <div className="flex items-start justify-between animate-in zoom-in-95 duration-500">
                    <div className="flex flex-col min-w-0 flex-1">
                       <span className="text-[7px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-0.5 leading-none">TARGET</span>
                       <h2 className="text-[20px] font-black text-slate-800 leading-none truncate mb-1 uppercase tracking-tight">
                         {targetName}
                       </h2>
                       <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-emerald-700 mono tabular-nums uppercase">v25.1.0-RC // Release ID: 1166</span>
                          <button onClick={() => copyToClipboard('1166', 'Release ID')} className="p-0.5 text-emerald-600/40 hover:text-emerald-700 transition-colors"><ICONS.Copy className="w-3 h-3"/></button>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-0.5 shrink-0 -mt-1.5 -mr-3">
                       <button 
                         onClick={() => setIsFavorite(!isFavorite)} 
                         title="Favorite Release"
                         className={`p-2 rounded-full transition-all hover:bg-black/5 ${isFavorite ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}
                       >
                          <ICONS.Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                       </button>
                       <button title="Download Archive" className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-black/5 transition-all">
                          <ICONS.Download className="w-5 h-5" />
                       </button>
                       <button onClick={() => handleTabChange('Releases')} title="Go to Release View" className="p-2 rounded-full text-slate-400 hover:text-brand hover:bg-black/5 transition-all">
                          <ICONS.ExternalLink className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between gap-4 relative flex-1">
                    <div className="flex flex-col flex-1 min-w-0">
                       <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">BASELINE</span>
                       <span className="text-[11px] font-bold text-slate-800 uppercase truncate">{baselinePrefix}_DMR_AO_REL</span>
                       <div className="flex items-center gap-1.5">
                         <span className="text-[10px] font-medium text-slate-500 mono tabular-nums truncate">v24.12.0 // ID: 1016</span>
                         <button onClick={() => copyToClipboard('1016', 'Baseline ID')} className="p-0.5 text-slate-300 hover:text-blue-600 transition-all rounded hover:bg-black/5"><ICONS.Copy className="w-2.5 h-2.5" /></button>
                       </div>
                    </div>
                    <div className="flex items-center justify-center shrink-0 px-4 opacity-10">
                       <svg className="w-10 h-4 text-slate-900" viewBox="0 0 24 12" fill="none"><path d="M1 6H23M23 6L18 1M23 6L18 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div className="flex flex-col flex-1 items-end text-right min-w-0">
                       <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">TARGET</span>
                       <span className="text-[11px] font-black text-brand uppercase truncate leading-none">{targetName}</span>
                       <div className="flex items-center gap-1.5 justify-end">
                         <span className="text-[10px] font-bold text-brand mono tabular-nums truncate uppercase">v25.1.0-RC</span>
                       </div>
                    </div>
                 </div>
               )}
             </div>

             {/* Unified Footer Slot - No Background Shading, Static Height */}
             <div className="flex items-center justify-between border-t border-black/[0.08] py-2.5 px-7 bg-transparent shrink-0">
                <div className="flex items-center">
                   <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-white shadow-sm transition-all duration-300 ${isSuccess ? 'bg-emerald-600' : isFailed ? 'bg-rose-600' : 'bg-brand'} ${isRunning ? 'animate-pulse' : ''} leading-none flex items-center h-4`}>
                      {isRunning ? 'In Progress' : isSuccess ? 'Success' : 'Failure'}
                   </div>
                </div>
                {/* Baseline in footer shown only when successfully finished */}
                {isSuccess && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-1 duration-300">
                     <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">BASELINE:</span>
                     <span className="text-[10px] font-bold text-slate-500 mono truncate opacity-70 leading-none">{baselinePrefix}_DMR_AO_REL v24.12.0 // ID: 1016</span>
                  </div>
                )}
             </div>

             {/* Unified Progress Bar Slot */}
             <div className="h-1.5 w-full bg-slate-900/5 overflow-hidden shrink-0">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${statusBarColor} ${isRunning ? 'animate-indeterminate-progress' : ''}`} 
                  style={isRunning ? {} : { width: '100%' }}
                />
             </div>
          </div>

          {/* Compact Wall Clock Metrics Card - col-span-3 */}
          <div className="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[110px] relative overflow-hidden group hover:border-slate-300 transition-colors">
             <div className="flex flex-col items-center flex-1 justify-center mt-0.5 px-6">
                <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em] mb-1 leading-none">METRICS</span>
                <span className="text-2xl font-black mono tracking-tight leading-none tabular-nums text-slate-800 drop-shadow-sm">
                   {formatSeconds(buildSeconds)}
                </span>
             </div>
             <div className="flex items-center justify-around border-t border-slate-50 mt-auto bg-slate-50/40 py-2.5 px-6 shrink-0">
                <div className="flex flex-col items-center flex-1">
                   <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5 tracking-widest">STARTED</span>
                   <span className="text-[10px] font-bold text-slate-600 leading-none mono tabular-nums">12/17 14:35:00</span>
                </div>
                <div className="h-5 w-[1px] bg-slate-200 mx-2" />
                <div className="flex flex-col items-center flex-1 min-w-[80px]">
                   <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5 tracking-widest">FINISHED</span>
                   <span className="text-[10px] font-bold leading-none mono tabular-nums text-slate-600">
                      {isCompleted ? '12/17 14:55:14' : '--:--:--'}
                   </span>
                </div>
             </div>
             <div className="h-1.5 w-full bg-slate-50 border-t border-slate-100 shrink-0" />
          </div>
        </div>

        {/* High-Density Stats Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar shrink-0">
          {[
            { label: 'Dep. Changes', val: `${MOCK_BUILD_DEPS.filter(d => d.isModified).length}/${MOCK_BUILD_DEPS.length}`, color: 'blue' },
            { label: 'Package Size', val: selectedStepId === 'step0' ? '4KB' : '32MB', color: 'slate' },
            { label: 'Complexity', val: selectedStepId === 'step0' ? 'Low' : 'High', color: 'purple' }
          ].map((stat, i) => (
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
              <div className="flex items-center gap-3"><div className="w-1 h-3 bg-amber-500 rounded-full" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{selectedStepId === 'step0' ? 'PATCH SETTINGS' : 'IFWI BUILD SETTINGS'}</span></div>
              <ICONS.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsedBuildSections.settings ? '' : 'rotate-90'}`} />
            </div>
            {!collapsedBuildSections.settings && (
               <div className="p-0 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 divide-x divide-slate-100">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SILICON FAMILY</span><span className="text-[12px] font-black text-slate-800 uppercase mono">DMR-AP</span></div>
                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SILICON STEP</span><span className="text-[12px] font-black text-slate-800 uppercase mono">AO</span></div>
                  </div>
               </div>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div onClick={() => toggleBuildSection('deps')} className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-1 h-3 bg-brand rounded-full" />
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{selectedStepId === 'step0' ? 'PATCH DEPENDENCIES' : 'IFWI DEPENDENCIES'}</span>
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
                          <td className="px-6 py-2.5 font-bold text-slate-700 truncate max-w-[200px]">{selectedStepId === 'step0' ? 'Unified_' : ''}Ingredient_{dep.id}</td>
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
