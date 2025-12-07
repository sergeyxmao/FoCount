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

const safeLower = (value: string | null | undefined): string => {
  return String(value ?? '').toLowerCase();
};

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
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const [search, setSearch] = useState('');

  // FILTER LOGIC
  const filteredList = useMemo(() => {
    if (!currentUser) return [];

    let list = partners.filter(p => p.id !== currentUser.id);
    const s = search.toLowerCase().trim();

    if (activeTab === 'offices') {
        return list.filter(p =>
          p.isOffice && (
                safeLower(p.city).includes(s) ||
                safeLower(p.name).includes(s) ||
                safeLower(p.country).includes(s)
            )
        );
    }

    if (activeTab === 'global') {
        return list.filter(p =>
            safeLower(p.fohowId).includes(s) ||
            safeLower(p.city).includes(s) ||
            safeLower(p.country).includes(s) ||
            safeLower(p.name).includes(s)
        );
    }

    if (activeTab === 'team') {
        if (teamSubTab === 'mentors') {
            const mentorIds = relationships
                .filter(r => r.status === 'confirmed')
                .filter(r => (r.initiatorId === currentUser.id && r.type === 'mentor') || (r.targetId === currentUser.id && r.type === 'downline'))
                .map(r => r.initiatorId === currentUser.id ? r.targetId : r.initiatorId);
            
            list = list.filter(p => mentorIds.includes(p.id));
        } 
        else if (teamSubTab === 'structure' || teamSubTab === 'ranks') {
            const downlineIds = relationships
                .filter(r => r.status === 'confirmed')
                .filter(r => (r.initiatorId === currentUser.id && r.type === 'downline') || (r.targetId === currentUser.id && r.type === 'mentor'))
                .map(r => r.initiatorId === currentUser.id ? r.targetId : r.initiatorId);
            
            list = list.filter(p => downlineIds.includes(p.id));

            if (teamSubTab === 'ranks' && selectedRank) {
                list = list.filter(p => p.rank === selectedRank);
            }
        }

        return list.filter(p =>
            safeLower(p.name).includes(s) ||
            safeLower(p.fohowId).includes(s) ||
            safeLower(p.city).includes(s) ||
            safeLower(p.country).includes(s)
        );
    }

    return [];
  }, [partners, activeTab, teamSubTab, selectedRank, search, relationships, currentUser]);

  // RENDER HELPERS
  const renderTeamTabs = () => (
    <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 px-1">
       <button 
         onClick={() => setTeamSubTab('mentors')}
         className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm ${teamSubTab === 'mentors' ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white shadow-[#D4AF37]/30' : 'bg-white text-gray-500 border border-gray-100'}`}
       >
         Наставники
       </button>
       <button 
         onClick={() => { setTeamSubTab('structure'); setSelectedRank(null); }}
         className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm ${teamSubTab === 'structure' ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white shadow-[#D4AF37]/30' : 'bg-white text-gray-500 border border-gray-100'}`}
       >
         Моя структура
       </button>
       <button 
       onClick={() => { setTeamSubTab('ranks'); setSelectedRank(Rank.EMERALD); }}
        className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm ${teamSubTab === 'ranks' ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white shadow-[#D4AF37]/30' : 'bg-white text-gray-500 border border-gray-100'}`}
      >
        По статусу
      </button>
    </div>
  );

  const renderRankFilter = () => (
    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
      {Object.values(Rank).map((rank) => (
        <button
          key={rank}
          onClick={() => setSelectedRank(rank)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selectedRank === rank 
              ? 'bg-[#D4AF37] text-white shadow-md' 
              : 'bg-white text-gray-500 border border-gray-100'
          }`}
        >
          {rank}
        </button>
      ))}
    </div>
  );

  const getSearchPlaceholder = () => {
    if (activeTab === 'global') return "Искать по ID, городу...";
    if (activeTab === 'team') return "Имя, ID, структура...";
    return "Поиск...";
  }

  return (
    <div className="pt-2 px-5 pb-20">
      
      {/* Search Bar - Styled to look like input field in screenshot */}
      <div className="relative mb-6 mt-2">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <Icons.Search size={18} />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-3.5 rounded-full border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] shadow-sm transition-shadow"
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
            className="w-full mb-6 bg-gradient-to-r from-amber-50 to-orange-50 text-[#B8860B] border border-[#D4AF37]/30 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold active:scale-[0.98] transition-transform shadow-sm"
          >
             <Icons.Mail />
             Написать всем ({filteredList.length})
          </button>
      )}

      {/* List */}
      <div className="space-y-3">
        {filteredList.map(partner => {
             const isConnected = activeTab === 'team';
             const showDetails = isConnected || partner.isPublic || partner.isOffice;
             
             return (
              <div 
                key={partner.id}
                onClick={() => onSelectPartner(partner, isConnected ? 'team' : 'global')}
                className="bg-white rounded-[20px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-50 flex items-center gap-4 active:scale-[0.98] transition-all hover:shadow-md cursor-pointer"
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={partner.avatar} 
                    alt={partner.name} 
                    className={`w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm ${!showDetails ? 'grayscale opacity-90' : ''}`}
                  />
                  {partner.isOffice && (
                    <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-white rounded-full p-1 shadow-sm border-2 border-white">
                      <div className="transform scale-[0.6]"><Icons.Briefcase /></div>
                    </div>
                  )}
                  {partner.rank && (
                      <div className="absolute -top-1 -right-1 bg-white text-[10px] font-bold text-[#B8860B] px-1.5 py-0.5 rounded-full shadow-sm border border-gray-100 flex items-center justify-center min-w-[18px] h-[18px]">
                          {partner.rank.charAt(0)}
                      </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className="text-[15px] font-bold text-gray-800 truncate leading-tight">{partner.name}</h3>
                  </div>
                  
                  <div className="text-xs text-gray-400 font-medium mb-1">{partner.city}, {partner.country}</div>

                  <div className="flex items-center justify-between">
                     {showDetails ? (
                        <div className="text-[10px] text-gray-300 font-mono tracking-wide">{partner.fohowId}</div>
                     ) : (
                        <span className="text-[10px] text-gray-300 flex items-center gap-1">
                           <Icons.Lock size={10} /> Скрыто
                        </span>
                     )}
                     
                     {/* Decorative icon on right (Trash for team, Arrow for global) */}
                     {isConnected && (
                         <div className="text-gray-300 hover:text-red-400 transition-colors">
                            {/* Visual only here, action is in Detail view as per logic */}
                            <Icons.Trash size={16} /> 
                         </div>
                     )}
                  </div>
                </div>
              </div>
            );
        })}
        
        {filteredList.length === 0 && (
          <div className="text-center py-12">
             <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto mb-4 text-[#D4AF37]">
                <Icons.Search size={24} />
             </div>
            <p className="text-gray-400 font-medium text-sm">Список пуст</p>
            <p className="text-gray-300 text-xs mt-1">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerList;
