'use client'

import { ArrowUpRight, AlertCircle, CheckCircle2, SlidersHorizontal, Bug } from 'lucide-react'

// Updated mock data to reflect specific diseases: Moniliophthora & Phytophthora
const MOCK_ACTIVITY = [
  {
    id: '001',
    date: 'TODAY 09:42',
    location: 'Plot A - Row 12',
    status: 'infected',
    diagnosis: 'Moniliophthora',
    confidence: '98%',
    type: 'fungal'
  },
  {
    id: '002',
    date: 'TODAY 09:15',
    location: 'Plot A - Row 11',
    status: 'healthy',
    diagnosis: 'Healthy',
    confidence: '99%',
    type: 'clean'
  },
  {
    id: '003',
    date: 'YESTERDAY',
    location: 'Plot B - Row 04',
    status: 'infected',
    diagnosis: 'Phytophthora',
    confidence: '94%',
    type: 'fungal'
  },
  {
    id: '004',
    date: 'YESTERDAY',
    location: 'Plot B - Row 03',
    status: 'healthy',
    diagnosis: 'Healthy',
    confidence: '97%',
    type: 'clean'
  },
  {
    id: '005',
    date: '2 DAYS AGO',
    location: 'Plot C - Row 01',
    status: 'infected',
    diagnosis: 'Moniliophthora',
    confidence: '89%',
    type: 'fungal'
  },
  {
    id: '006',
    date: '2 DAYS AGO',
    location: 'Plot C - Row 02',
    status: 'healthy',
    diagnosis: 'Healthy',
    confidence: '98%',
    type: 'clean'
  }
]

export default function RecentActivity() {
  return (
    <section className="w-full h-full flex flex-col bg-background border-t md:border-t-0">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-800/10">
        <div>
          <h3 className="text-sm font-medium uppercase tracking-widest">
            Scan History
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            Recent Analysis Results
          </p>
        </div>
        <button className="flex items-center gap-2 text-xs uppercase tracking-widest hover:text-primary transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {MOCK_ACTIVITY.map((item) => (
          <div 
            key={item.id} 
            className="group flex items-center justify-between p-4 border-b border-neutral-800/5 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
               {/* Icon Status */}
               <div className={`mt-1 w-8 h-8 flex items-center justify-center rounded-full border ${
                  item.status === 'infected' 
                    ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30' 
                    : 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30'
               }`}>
                  {item.status === 'infected' ? <Bug className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
               </div>

               <div>
                 <div className="flex items-center gap-2">
                    <p className={`text-xs font-bold uppercase tracking-wide ${
                      item.status === 'infected' ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {item.diagnosis}
                    </p>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {item.confidence}
                    </span>
                 </div>
                 <p className="text-xs font-medium text-foreground mt-0.5">
                   {item.location}
                 </p>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                   {item.date}
                 </p>
               </div>
            </div>

            <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-foreground transition-colors" />
          </div>
        ))}
      </div>
    </section>
  )
}
