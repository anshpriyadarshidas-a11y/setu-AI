import { useState, useEffect } from 'react'

export default function AlertPopup({ alert, onClose }) {
  if (!alert) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-[#0a2e1f] border-2 border-orange-500 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-500/20 rounded-full text-orange-400 text-2xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">Route Risk Update</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-[#143d2c] p-3 rounded-lg border border-[#2d5a47]">
            <p className="text-xs text-teal-300 uppercase">Segment</p>
            <p className="font-semibold text-white">{alert.segmentName}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#143d2c] p-3 rounded-lg border border-[#2d5a47]">
              <p className="text-xs text-teal-300 uppercase">Old Risk</p>
              <p className="font-bold text-white">{alert.oldLevel}</p>
            </div>
            <div className="bg-[#143d2c] p-3 rounded-lg border border-[#2d5a47]">
              <p className="text-xs text-orange-200 uppercase">New Risk</p>
              <p className="font-bold text-orange-400">{alert.newLevel}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl transition"
        >
          View Alternate Route
        </button>
      </div>
    </div>
  )
}
