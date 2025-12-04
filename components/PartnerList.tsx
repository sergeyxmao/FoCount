import React, { useState, useMemo } from 'react';
import { Partner, Rank, User, Relationship, AppTab, TeamSubTab } from '../types';
import { Icons } from '../constants';

interface PartnerListProps {
  activeTab: AppTab;
  partners: Partner[];
  relationships: Relationship[];
  onSelectPartner: (partner: Partner, context: 'team' | 'global') => void;
  currentUser: User | null;
  onBroadcast?: (rank: Rank, partners: Partner[]) => void;
}

const PartnerList: React.FC<PartnerListProps> = ({ 
  activeTab, 
  partners, 
  relationships, 
  onSelectPartner, 
  currentUser,
  onBroadcast
}) => {
  const isClient = currentUser?.role === 'client';
  const [teamSubTab, setTeamSubTab] = useState<TeamSubTab>('structure');
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null); // For rank filtering in Team
  const [search, setSearch] = useState('');

  // FILTER LOGIC
  const filteredList = useMemo(() => {
  const filteredList = useMemo(() => {
  console.log('🔍 PartnerList:', { activeTab, partnersCount: partners.length, currentUserId: currentUser?.id });  
    if (!currentUser) return [];

    let list = partners.filter(p => p.id !== currentUser.id); // Exclude self
    const s = search.toLowerCase().trim();

    if (activeTab === 'offices') {
        return list.filter(p => 
            p.isOffice && (
                p.city.toLowerCase().includes(s) || 
                p.name.toLowerCase().includes(s) ||
                p.country.toLowerCase().includes(s)
            )
        );
    }

    if (activeTab === 'global') {
        // Global Search (Partners & Clients)
        // Fields: Fohow ID, City, Country (and Name for basic UX)
        return list.filter(p => 
            p.fohowId.toLowerCase().includes(s) ||
            p.city.toLowerCase().includes(s) ||
            p.country.toLowerCase().includes(s) ||
            p.name.toLowerCase().includes(s)
        );
    }

    if (activeTab === 'team') {
        // Team Search
        // Fields: Name, ID, City, Country
        
        if (teamSubTab === 'mentors') {
            // My Mentors
            const mentorIds = relationships
                .filter(r => r.status === 'confirmed')
                .filter(r => (r.initiatorId === currentUser.id && r.type === 'mentor') || (r.targetId === currentUser.id && r.type === 'downline'))
                .map(r => r.initiatorId === currentUser.id ? r.targetId : r.initiatorId);
            
            list = list.filter(p => mentorIds.includes(p.id));
        } 
        else if (teamSubTab === 'structure' || teamSubTab === 'ranks') {
            // My Structure
            const downlineIds = relationships
                .filter(r => r.status === 'confirmed')
                .filter(r => (r.initiatorId === currentUser.id && r.type === 'downline') || (r.targetId === currentUser.id && r.type === 'mentor'))
                .map(r => r.initiatorId === currentUser.id ? r.targetId : r.initiatorId);
            
            list = list.filter(p => downlineIds.includes(p.id));

            if (teamSubTab === 'ranks' && selectedRank) {
                list = list.filter(p => p.rank === selectedRank);
            }
        }

        // Apply Search Filter for Team
        return list.filter(p => 
            p.name.toLowerCase().includes(s) || 
            p.fohowId.toLowerCase().includes(s) || 
            p.city.toLowerCase().includes(s) || 
            p.country.toLowerCase().includes(s)
        );
    }

    return [];
  }, [partners, activeTab, teamSubTab, selectedRank, search, relationships, currentUser]);

  // RENDER HELPERS
  const renderTeamTabs = () => (
    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
       <button 
         onClick={() => setTeamSubTab('mentors')}
         className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${teamSubTab === 'mentors' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
       >
         Наставники
       </button>
       <button 
         onClick={() => { setTeamSubTab('structure'); setSelectedRank(null); }}
         className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${teamSubTab === 'structure' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
       >
         Моя структура
       </button>
       <button 
       onClick={() => { setTeamSubTab('ranks'); setSelectedRank(Rank.EMERALD); }}
        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${teamSubTab === 'ranks' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
      >
        По статусу
      </button>
    </div>
  );

  const renderRankFilter = () => (
    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
      {Object.values(Rank).map((rank) => (
        <button
          key={rank}
          onClick={() => setSelectedRank(rank)}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selectedRank === rank 
              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
              : 'bg-white text-gray-500 border border-gray-200'
          }`}
        >
          {rank}
        </button>
      ))}
    </div>
  );

  const getSearchPlaceholder = () => {
    if (activeTab === 'global') return "Поиск по ID, городу, стране...";
    if (activeTab === 'team') return "Имя, ID, город, страна...";
    return "Поиск...";
  }

  return (
    <div className="pt-4 px-4 pb-4">
      
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Icons.Search />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder={getSearchPlaceholder()}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Sub Tabs for Team */}
      {activeTab === 'team' && !isClient && renderTeamTabs()}
      
      {/* Rank Filters for Rank Tab */}
      {activeTab === 'team' && teamSubTab === 'ranks' && renderRankFilter()}

      {/* Broadcast Button */}
      {activeTab === 'team' && teamSubTab === 'ranks' && selectedRank && filteredList.length > 0 && onBroadcast && (
          <button 
            onClick={() => onBroadcast(selectedRank, filteredList)}
            className="w-full mb-4 bg-amber-50 text-amber-700 border border-amber-200 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold active:bg-amber-100"
          >
             <Icons.Mail />
             Написать всем ({filteredList.length})
          </button>
      )}

      {/* List */}
      <div className="space-y-3">
        {filteredList.map(partner => {
             // Access Logic for Visuals
             // Team & Mentors: Full Access
             // Global: Restricted unless Public/Office
             const isConnected = activeTab === 'team';
             const showDetails = isConnected || partner.isPublic || partner.isOffice;
             
             return (
              <div 
                key={partner.id}
                onClick={() => onSelectPartner(partner, isConnected ? 'team' : 'global')}
                className={`rounded-2xl p-4 shadow-sm border flex items-center gap-4 active:scale-[0.99] transition-transform bg-white border-gray-100`}
              >
                <div className="relative">
                  <img 
                    src={partner.avatar} 
                    alt={partner.name} 
                    className={`w-14 h-14 rounded-full object-cover shadow-sm ${!showDetails ? 'grayscale opacity-90' : ''}`}
                  />
                  {partner.isOffice && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 shadow-sm border-2 border-white">
                      <div className="transform scale-[0.5]"><Icons.Briefcase /></div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-gray-900 truncate">{partner.name}</h3>
                    {partner.rank && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">
                            {partner.rank.split(' ')[0]}
                        </span>
                    )}
                  </div>
                  
                  {showDetails && (
                    <div className="text-[10px] text-gray-400 font-mono mb-0.5">{partner.fohowId}</div>
                  )}

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1 text-gray-500 text-xs truncate">
                        <span>{partner.city},</span>
                        <span className="text-gray-400">{partner.country}</span>
                    </div>
                    {!showDetails && (
                       <span className="text-[10px] text-gray-400 flex items-center gap-1">
                         <div className="w-2.5 h-2.5"><Icons.Lock /></div>
                       </span>
                    )}
                  </div>
                </div>
              </div>
            );
        })}
        
        {filteredList.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p>Никого не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerList;
