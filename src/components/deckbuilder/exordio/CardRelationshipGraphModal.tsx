'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, X, Sparkles, Filter, Search, Link2 } from 'lucide-react';
import { DeckCard } from '@/components/deckbuilder/types';
import { buildDeckCardGraph, GraphNode, GraphEdge } from '@/lib/engines/cardGraphEngine';

interface CardRelationshipGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckCards: DeckCard[];
}

export const CardRelationshipGraphModal: React.FC<CardRelationshipGraphModalProps> = ({
  isOpen,
  onClose,
  deckCards,
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterRelation, setFilterRelation] = useState<string>('all');

  const graphData = useMemo(() => {
    return buildDeckCardGraph(deckCards);
  }, [deckCards]);

  const filteredEdges = useMemo(() => {
    if (filterRelation === 'all') return graphData.edges;
    return graphData.edges.filter((e) => e.relation === filterRelation);
  }, [graphData.edges, filterRelation]);

  // Encontrar conexiones del nodo seleccionado
  const selectedNodeConnections = useMemo(() => {
    if (!selectedNode) return [];
    return graphData.edges.filter(
      (e) => e.sourceId === selectedNode.id || e.targetId === selectedNode.id
    );
  }, [selectedNode, graphData.edges]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight">
                Grafo Relacional &amp; Sinergias del Deck
              </h2>
              <p className="text-xs text-zinc-400">
                Visualiza qué cartas buscan, invocan, envían al cementerio o protegen a otras
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros de Relación */}
        <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-zinc-400">Tipo de Enlace:</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'searches', label: 'Búsquedas (Search)' },
                { id: 'special_summons', label: 'Invocaciones (SS)' },
                { id: 'sends_to_gy', label: 'Envío al GY' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterRelation(f.id)}
                  className={`px-2.5 py-1 rounded-md font-bold uppercase text-[10px] transition-all ${
                    filterRelation === f.id
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
            <span>Nodos: {graphData.nodes.length}</span>
            <span>Conexiones: {filteredEdges.length}</span>
          </div>
        </div>

        {/* Contenido Principal: Cuadrícula de Nodos y Panel de Relación */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Nodos de Cartas */}
          <div className="md:col-span-8 p-6 overflow-y-auto scrollbar-thin border-r border-zinc-800/60 bg-zinc-950/40">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {graphData.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const nodeEdgeCount = graphData.edges.filter(
                  (e) => e.sourceId === node.id || e.targetId === node.id
                ).length;

                return (
                  <motion.div
                    key={node.id}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setSelectedNode(node)}
                    className={`cursor-pointer p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-16 h-24 relative rounded overflow-hidden border border-zinc-700 shadow">
                      <Image
                        src={node.image_url}
                        alt={node.name}
                        fill
                        sizes="70px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-[11px] font-black text-center truncate w-full">
                      {node.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          node.role === 'starter'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : node.role === 'extender'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : node.role === 'boss'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {node.role}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        ({nodeEdgeCount} links)
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Panel Lateral: Detalle de Conexiones */}
          <div className="md:col-span-4 p-6 bg-zinc-900/30 flex flex-col justify-between overflow-y-auto scrollbar-thin">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                  <div className="w-14 h-20 relative rounded overflow-hidden border border-red-500 shrink-0">
                    <Image
                      src={selectedNode.image_url}
                      alt={selectedNode.name}
                      fill
                      sizes="60px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{selectedNode.name}</h3>
                    <span className="text-xs text-zinc-400 font-mono">{selectedNode.type}</span>
                    <div className="mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-600/30 text-red-400 font-bold uppercase border border-red-500/40">
                        Rol: {selectedNode.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-2">
                    Conexiones Activas ({selectedNodeConnections.length})
                  </span>

                  {selectedNodeConnections.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">
                      Esta carta no posee sinergias directas con el resto de cartas en este filtro.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedNodeConnections.map((edge, idx) => {
                        const isSource = edge.sourceId === selectedNode.id;
                        const otherCard = graphData.nodes.find(
                          (n) => n.id === (isSource ? edge.targetId : edge.sourceId)
                        );

                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60 text-xs space-y-1"
                          >
                            <div className="flex items-center gap-1.5 font-bold text-red-400">
                              <Link2 className="w-3.5 h-3.5" />
                              <span>{isSource ? 'Hacia:' : 'Desde:'} {otherCard?.name}</span>
                            </div>
                            <p className="text-[11px] text-zinc-300">
                              {edge.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <Network className="w-12 h-12 mb-3 opacity-30 text-red-500" />
                <span className="text-sm font-bold text-zinc-400">Selecciona una carta</span>
                <p className="text-xs mt-1">
                  Haz clic en cualquier carta de la izquierda para ver todas sus sinergias y dependencias.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
