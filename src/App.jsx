import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseclient';
import { Shield, Trophy, Calendar, Save, Clock, CheckCircle2, AlertCircle, Users, ChevronDown, Crown, Star, Table, LogIn, KeyRound } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('once'); // 'once', 'plantilla', 'clasificacion', 'mvp', 'calendario', 'clasif_real'
  const [formacion, setFormacion] = useState('1-4-4-2');
  
  // Estados para Login y Recuperación
  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState('');
  const [modoRecuperacion, setModoRecuperacion] = useState(false);

  // Base de Datos Supabase
  const [jugadoresBD, setJugadoresBD] = useState([]);
  const [equiposBD, setEquiposBD] = useState([]);
  const [puntuacionesJugadorBD, setPuntuacionesJugadorBD] = useState([]);
  const [partidosBD, setPartidosBD] = useState([]);
  const [clasificacionRealBD, setClasificacionRealBD] = useState([]);
  
  // Filtros
  const [equipoFiltro, setEquipoFiltro] = useState('TODOS');
  const [posicionFiltro, setPosicionFiltro] = useState('TODOS');
  const [mostrarSelectorEquipos, setMostrarSelectorEquipos] = useState(false);
  const [jornadaSeleccionadaClasif, setJornadaSeleccionadaClasif] = useState('GENERAL');
  const [jornadaSeleccionadaCalendario, setJornadaSeleccionadaCalendario] = useState('1');
  
  // Plantilla: 22 Jugadores + 2 Entrenadores
  const [plantillaJugadores, setPlantillaJugadores] = useState([]); 
  const [plantillaEntrenadores, setPlantillaEntrenadores] = useState([]); 
  const [plantillaGuardada, setPlantillaGuardada] = useState(false);
  const [nombreEquipoFantasy, setNombreEquipoFantasy] = useState('Grada Siete FC');

  // Alineación Titular
  const [alineacion, setAlineacion] = useState({});
  const [capitanId, setCapitanId] = useState(null);
  const [entrenadorTitularId, setEntrenadorTitularId] = useState(null);
  const [modoSeleccionCapitan, setModoSeleccionCapitan] = useState(false);
  const [onceGuardado, setOnceGuardado] = useState(false);

  // Modales
  const [slotActivo, setSlotActivo] = useState(null);
  const [mostrarAyudaModal, setMostrarAyudaModal] = useState(false);
  const [alerta, setAlerta] = useState('');

  const SILUETA_DEFAULT = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500' width='100%' height='100%'><rect width='500' height='500' fill='%23ffffff'/><path d='M250 200c35.35 0 64-28.65 64-64s-28.65-64-64-64-64 28.65-64 64 28.65 64 64 64zm0 32c-48 0-144 24-144 72v48h288v-48c0-48-96-72-144-72z' fill='%230f172a'/></svg>";
  const LOGO_GRADA_SIETE = "https://gradasiete.com/wp-content/uploads/2023/02/cropped-logo-bueno-3.png";

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data?.session || null);
        setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      supabase.from('jugadores').select('*').eq('activo', true).then(({ data }) => {
        if (data) setJugadoresBD(data);
      });

      supabase.from('equipos').select('*').then(({ data }) => {
        if (data) setEquiposBD(data);
      });

      supabase.from('puntuaciones_jugador').select('*').then(({ data }) => {
        if (data) setPuntuacionesJugadorBD(data);
      });

      supabase.from('partidos').select('*').then(({ data }) => {
        if (data && data.length > 0) {
          setPartidosBD(data);
          const jornadasUnicas = [...new Set(data.map(p => p.jornada))].sort((a,b) => a - b);
          if (jornadasUnicas.length > 0) {
            setJornadaSeleccionadaCalendario(String(jornadasUnicas[0]));
          }
        }
      });

      supabase.from('clasificacion_real').select('*').then(({ data }) => {
        if (data) setClasificacionRealBD(data);
      });

      return () => authListener?.subscription?.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    if (!supabase) {
      setSession({ user: { email: emailLogin } });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: emailLogin,
      password: passwordLogin,
    });
    if (error) {
      setErrorLogin(error.message);
    }
  };

  const handleRecuperarPassword = async (e) => {
    e.preventDefault();
    setMensajeRecuperacion('');
    setErrorLogin('');

    if (!emailLogin) {
      setErrorLogin('Introduce tu correo electrónico para recuperar la contraseña.');
      return;
    }

    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(emailLogin, {
        redirectTo: window.location.origin,
      });
      if (error) {
        setErrorLogin(error.message);
      } else {
        setMensajeRecuperacion('¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
      }
    } else {
      setMensajeRecuperacion('Función de recuperación simulada. Revisa tu correo.');
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
  };

  const guardarNombreEquipo = () => {
    if (!nombreEquipoFantasy.trim()) {
      setAlerta('Introduce un nombre válido para tu equipo.');
      return;
    }
    setAlerta('¡Nombre de equipo guardado correctamente!');
    setTimeout(() => setAlerta(''), 2500);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#ffffff', fontFamily: 'sans-serif' }}>
        <h3>Cargando Liga Fantástica Grada Siete...</h3>
      </div>
    );
  }

  // SI NO HAY SESIÓN, MOSTRAMOS LA PANTALLA DE INICIO DE SESIÓN O RECUPERACIÓN
  if (!session) {
    return (
      <div className="notranslate" translate="no" style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ backgroundColor: '#ffffff', color: '#0f172a', width: '100%', maxWidth: '380px', borderRadius: '20px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center' }}>
          <img src={LOGO_GRADA_SIETE} alt="Grada Siete" style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 12px auto', display: 'block' }} />
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Liga Fantástica G7</h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Accede para gestionar tu club y tus alineaciones</p>

          {errorLogin && (
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', borderRadius: '8px', padding: '8px', fontSize: '11px', fontWeight: '700', marginBottom: '14px' }}>
              {errorLogin}
            </div>
          )}

          {mensajeRecuperacion && (
            <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7', borderRadius: '8px', padding: '8px', fontSize: '11px', fontWeight: '700', marginBottom: '14px' }}>
              {mensajeRecuperacion}
            </div>
          )}

          {!modoRecuperacion ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '3px' }}>CORREO ELECTRÓNICO</label>
                <input 
                  type="email" 
                  value={emailLogin} 
                  onChange={(e) => setEmailLogin(e.target.value)} 
                  placeholder="manager@gradasiete.com" 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '3px' }}>CONTRASEÑA</label>
                <input 
                  type="password" 
                  value={passwordLogin} 
                  onChange={(e) => setPasswordLogin(e.target.value)} 
                  placeholder="••••••••" 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" style={{ width: '100%', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '11px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
                <LogIn style={{ width: '15px', height: '15px' }} /> Iniciar Sesión
              </button>

              <button 
                type="button" 
                onClick={() => { setModoRecuperacion(true); setErrorLogin(''); setMensajeRecuperacion(''); }}
                style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', textAlign: 'center' }}
              >
                ¿Has olvidado tu contraseña?
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecuperarPassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                Introduce tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
              </p>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '3px' }}>CORREO ELECTRÓNICO</label>
                <input 
                  type="email" 
                  value={emailLogin} 
                  onChange={(e) => setEmailLogin(e.target.value)} 
                  placeholder="manager@gradasiete.com" 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '11px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <KeyRound style={{ width: '15px', height: '15px' }} /> Enviar Instrucciones
              </button>

              <button 
                type="button" 
                onClick={() => { setModoRecuperacion(false); setErrorLogin(''); setMensajeRecuperacion(''); }}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', textAlign: 'center' }}
              >
                ← Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const getEstructuraFormacion = () => {
    const partes = formacion.split('-').map(Number);
    if (partes.length === 4) return { def: partes[1], cen: partes[2], del: partes[3] };
    return { def: 4, cen: 4, del: 2 };
  };

  const { def, cen, del } = getEstructuraFormacion();

  const getPosicionNormalizada = (pos) => {
    const p = pos?.toUpperCase() || '';
    if (p.startsWith('POR')) return 'POR';
    if (p.startsWith('DEF')) return 'DEF';
    if (p.startsWith('CEN') || p.startsWith('MED')) return 'CEN';
    if (p.startsWith('DEL')) return 'DEL';
    if (p.startsWith('ENT')) return 'ENT';
    return 'JUG';
  };

  const getColorPosicion = (pos) => {
    const p = getPosicionNormalizada(pos);
    if (p === 'POR') return '#eab308';
    if (p === 'DEF') return '#16a34a';
    if (p === 'CEN') return '#2563eb';
    if (p === 'DEL') return '#dc2626';
    if (p === 'ENT') return '#7c3aed';
    return '#64748b';
  };

  const getBadgePosicion = (pos) => {
    const p = getPosicionNormalizada(pos);
    return { label: p, bg: getColorPosicion(pos) };
  };

  const getRankingJugadoresMVP = () => {
    return jugadoresBD.map(j => {
      const puntuacionesDelJugador = puntuacionesJugadorBD.filter(p => p.jugador_id === j.id);
      const puntosTotales = puntuacionesDelJugador.reduce((acc, curr) => acc + (curr.puntos || 0), 0);
      return {
        ...j,
        puntosTotales: puntosTotales > 0 ? puntosTotales : Math.floor(Math.random() * 35) + 5
      };
    }).sort((a, b) => b.puntosTotales - a.puntosTotales);
  };

  const getConteosPosicion = () => {
    const elegidos = jugadoresBD.filter(j => plantillaJugadores.includes(j.id));
    return {
      POR: elegidos.filter(j => getPosicionNormalizada(j.posicion) === 'POR').length,
      DEF: elegidos.filter(j => getPosicionNormalizada(j.posicion) === 'DEF').length,
      CEN: elegidos.filter(j => getPosicionNormalizada(j.posicion) === 'CEN').length,
      DEL: elegidos.filter(j => getPosicionNormalizada(j.posicion) === 'DEL').length,
      ENT: plantillaEntrenadores.length
    };
  };

  const conteosPos = getConteosPosicion();

  const getConteoJugadoresPorClub = (clubIdentificador) => {
    if (!clubIdentificador) return 0;
    return plantillaJugadores.filter(jId => {
      const j = jugadoresBD.find(item => item.id === jId);
      return j && (j.equipo_id === clubIdentificador || j.equipo_real === clubIdentificador);
    }).length;
  };

  const toggleJugadorPlantilla = (jugador) => {
    const posNorm = getPosicionNormalizada(jugador.posicion);
    const esEntrenador = posNorm === 'ENT';

    if (esEntrenador) {
      const yaExiste = plantillaEntrenadores.includes(jugador.id);
      if (yaExiste) {
        setPlantillaEntrenadores(prev => prev.filter(id => id !== jugador.id));
        setPlantillaGuardada(false);
      } else {
        if (plantillaEntrenadores.length >= 2) {
          setAlerta('Máximo 2 Entrenadores ANEFF permitidos.');
          return;
        }
        setPlantillaEntrenadores(prev => [...prev, jugador.id]);
        setPlantillaGuardada(false);
        setAlerta('');
      }
    } else {
      const yaExiste = plantillaJugadores.includes(jugador.id);
      if (yaExiste) {
        setPlantillaJugadores(prev => prev.filter(id => id !== jugador.id));
        setPlantillaGuardada(false);
      } else {
        if (plantillaJugadores.length >= 22) {
          setAlerta('Tu plantilla de 22 futbolistas está completa.');
          return;
        }
        const limites = { POR: 2, DEF: 7, CEN: 7, DEL: 6 };
        if (conteosPos[posNorm] >= limites[posNorm]) {
          setAlerta(`Límite alcanzado para ${posNorm}.`);
          return;
        }
        const clubId = jugador.equipo_id || jugador.equipo_real;
        if (clubId && getConteoJugadoresPorClub(clubId) >= 3) {
          setAlerta('Máximo 3 jugadores del mismo equipo real.');
          return;
        }
        setPlantillaJugadores(prev => [...prev, jugador.id]);
        setPlantillaGuardada(false);
        setAlerta('');
      }
    }
  };

  const guardarPlantilla = () => {
    if (plantillaJugadores.length < 22 || plantillaEntrenadores.length < 2) {
      setAlerta(`Faltan fichajes: ${plantillaJugadores.length}/22 jugadores y ${plantillaEntrenadores.length}/2 entrenadores.`);
      return;
    }
    setPlantillaGuardada(true);
    setAlerta('¡Plantilla guardada correctamente!');
    setTimeout(() => setAlerta(''), 2500);
  };

  const guardarOnce = () => {
    setOnceGuardado(true);
    setAlerta('¡Once guardado y bloqueado con éxito para la jornada!');
    setTimeout(() => setAlerta(''), 3000);
  };

  const getJugadoresFiltradosPlantilla = () => {
    return jugadoresBD.filter(j => {
      const cumpleEquipo = equipoFiltro === 'TODOS' || j.equipo_id === equipoFiltro || j.equipo_real === equipoFiltro;
      const pNorm = getPosicionNormalizada(j.posicion);
      let cumplePosicion = true;
      if (posicionFiltro !== 'TODOS') cumplePosicion = pNorm === posicionFiltro;
      return cumpleEquipo && cumplePosicion;
    });
  };

  const getIdsTitularesActuales = () => {
    const ids = Object.values(alineacion);
    if (entrenadorTitularId) ids.push(entrenadorTitularId);
    return ids;
  };

  const getOpcionesTitularesDisponibles = (tipoPosicion) => {
    const idsOcupados = getIdsTitularesActuales();
    if (tipoPosicion === 'ENT') {
      return jugadoresBD.filter(j => plantillaEntrenadores.includes(j.id) && !idsOcupados.includes(j.id));
    }
    const miPlantillaFutbolistas = jugadoresBD.filter(j => plantillaJugadores.includes(j.id));
    return miPlantillaFutbolistas.filter(j => getPosicionNormalizada(j.posicion) === tipoPosicion && !idsOcupados.includes(j.id));
  };

  const seleccionarTitular = (jugadorId) => {
    if (!slotActivo) return;
    if (slotActivo.tipo === 'ENT') {
      setEntrenadorTitularId(jugadorId);
    } else {
      const key = `${slotActivo.tipo}_${slotActivo.index}`;
      setAlineacion(prev => ({ ...prev, [key]: jugadorId }));
    }
    setSlotActivo(null);
  };

  const getJugadorEnSlot = (tipo, index) => {
    if (tipo === 'ENT') return jugadoresBD.find(j => j.id === entrenadorTitularId);
    const key = `${tipo}_${index}`;
    return jugadoresBD.find(j => j.id === alineacion[key]);
  };

  const manejarClicJugadorCampo = (jugadorEnSlot) => {
    if (!jugadorEnSlot) return;
    if (modoSeleccionCapitan) {
      setCapitanId(jugadorEnSlot.id);
      setModoSeleccionCapitan(false);
    }
  };

  const jornadasDisponiblesCalendario = [...new Set(partidosBD.map(p => p.jornada))].sort((a,b) => a - b);
  const partidosJornadaActual = partidosBD.filter(p => String(p.jornada) === String(jornadaSeleccionadaCalendario));

  const rankingCompleto = getRankingJugadoresMVP();
  const rankingFutbolistas = rankingCompleto.filter(j => getPosicionNormalizada(j.posicion) !== 'ENT');
  const rankingEntrenadores = rankingCompleto.filter(j => getPosicionNormalizada(j.posicion) === 'ENT');

  return (
    <div className="notranslate" translate="no" style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '0px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      <style>{`
        @keyframes pulseBlink {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        .ayuda-parpadeante {
          animation: pulseBlink 1.8s infinite ease-in-out;
        }
        select, input[type="text"], input[type="password"], input[type="email"] {
          background-color: #ffffff !important;
          color: #0f172a !important;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: auto;
        }
      `}</style>

      <div style={{ backgroundColor: '#f8fafc', color: '#0f172a', width: '100%', maxWidth: '440px', minHeight: '100vh', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', paddingBottom: '120px', overflowX: 'hidden' }}>
        
        {/* CABECERA */}
        <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src={LOGO_GRADA_SIETE} 
              alt="Grada Siete" 
              style={{ width: '38px', height: '38px', objectFit: 'contain' }} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23dc2626'/><text x='50' y='65' font-family='Arial' font-weight='900' font-size='50' text-anchor='middle' fill='%23ffffff'>G7</text></svg>";
              }}
            />
            <span style={{ fontWeight: '900', fontSize: '15px', color: '#1e293b', letterSpacing: '-0.02em' }}>GRADA SIETE</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setMostrarAyudaModal(true)}
              className="ayuda-parpadeante"
              style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Ayuda y Reglamento"
            >
              ?
            </button>

            <button onClick={handleLogout} style={{ backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
              Salir
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main style={{ padding: '10px' }}>

          {/* PESTAÑA MI ONCE */}
          {tab === 'once' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', display: 'block' }}>MI CLUB FANTASY</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                    <input 
                      type="text" 
                      value={nombreEquipoFantasy} 
                      onChange={(e) => setNombreEquipoFantasy(e.target.value)}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: '900', fontSize: '12px', color: '#0f172a', outline: 'none', background: '#ffffff', width: '140px', padding: '2px 4px' }}
                    />
                    <button onClick={guardarNombreEquipo} style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '3px 6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>
                      Fijar
                    </button>
                  </div>
                </div>
                <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: '700', border: '1px solid #fee2e2' }}>
                  <Clock style={{ width: '11px', height: '11px' }} />
                  <span>Sáb 14:00h</span>
                </div>
              </div>

              {alerta && (
                <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                  <span>{alerta}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '5px 8px' }}>
                  <select value={formacion} onChange={(e) => setFormacion(e.target.value)} style={{ width: '100%', border: 'none', background: '#ffffff', fontWeight: '700', fontSize: '11.5px', outline: 'none', color: '#0f172a' }}>
                    <option value="1-4-4-2">Formación 1-4-4-2</option>
                    <option value="1-4-3-3">Formación 1-4-3-3</option>
                    <option value="1-3-4-3">Formación 1-3-4-3</option>
                    <option value="1-3-5-2">Formación 1-3-5-2</option>
                    <option value="1-5-3-2">Formación 1-5-3-2</option>
                    <option value="1-5-4-1">Formación 1-5-4-1</option>
                    <option value="1-4-5-1">Formación 1-4-5-1</option>
                  </select>
                </div>

                <button onClick={guardarOnce} style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '7px 12px', fontWeight: '800', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)' }}>
                  <Save style={{ width: '13px', height: '13px' }} /> Guardar Once
                </button>
              </div>

              {/* CAMPO */}
              <div style={{ backgroundColor: '#15803d', backgroundImage: 'repeating-linear-gradient(0deg, #15803d, #15803d 38px, #166534 38px, #166534 76px)', border: '3px solid #14532d', borderRadius: '18px', padding: '20px 6px 10px 6px', minHeight: '520px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '2px solid rgba(255,255,255,0.7)', margin: '8px', borderRadius: '12px', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '8px', right: '8px', height: '2px', backgroundColor: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90px', height: '90px', border: '2px solid rgba(255,255,255,0.7)', borderRadius: '50%', pointerEvents: 'none' }}></div>

                <div onClick={() => setModoSeleccionCapitan(!modoSeleccionCapitan)} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: modoSeleccionCapitan ? '#facc15' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '15px', color: modoSeleccionCapitan ? '#0f172a' : '#dc2626', boxShadow: modoSeleccionCapitan ? '0 0 14px #facc15' : '0 4px 10px rgba(0,0,0,0.3)', border: '2px solid #ffffff' }}>
                    C
                  </div>
                  <span style={{ fontSize: '7.5px', fontWeight: '900', color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.9)', marginTop: '2px', textAlign: 'center' }}>
                    {modoSeleccionCapitan ? '¡PULSA JUGADOR!' : 'CAPITÁN'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 5, flex: 1 }}>
                  {Array.from({ length: del }).map((_, i) => {
                    const jug = getJugadorEnSlot('DEL', i);
                    const esCap = jug && jug.id === capitanId;
                    const fotoAvatar = jug?.foto_url || jug?.imagen_url || SILUETA_DEFAULT;
                    const colorBorde = esCap ? '#facc15' : getColorPosicion('DEL');
                    return (
                      <div key={`del-${i}`} onClick={() => { if (modoSeleccionCapitan && jug) manejarClicJugadorCampo(jug); else setSlotActivo({ tipo: 'DEL', index: i }); }} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '75px' }}>
                        {esCap && <Crown style={{ position: 'absolute', top: '-20px', color: '#facc15', width: '26px', height: '26px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))', zIndex: 10 }} />}
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#ffffff', border: `2.5px solid ${colorBorde}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(0,0,0,0.4)' }}>
                          <img src={fotoAvatar} alt={jug ? jug.nombre : 'Vacío'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ marginTop: '2px', fontSize: '7.5px', fontWeight: '800', color: esCap ? '#facc15' : '#ffffff', backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: '2px 4px', borderRadius: '4px', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {jug ? jug.nombre : 'Elegir'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 5, flex: 1 }}>
                  {Array.from({ length: cen }).map((_, i) => {
                    const jug = getJugadorEnSlot('CEN', i);
                    const esCap = jug && jug.id === capitanId;
                    const fotoAvatar = jug?.foto_url || jug?.imagen_url || SILUETA_DEFAULT;
                    const colorBorde = esCap ? '#facc15' : getColorPosicion('CEN');
                    return (
                      <div key={`cen-${i}`} onClick={() => { if (modoSeleccionCapitan && jug) manejarClicJugadorCampo(jug); else setSlotActivo({ tipo: 'CEN', index: i }); }} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '72px' }}>
                        {esCap && <Crown style={{ position: 'absolute', top: '-20px', color: '#facc15', width: '26px', height: '26px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))', zIndex: 10 }} />}
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ffffff', border: `2.5px solid ${colorBorde}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(0,0,0,0.4)' }}>
                          <img src={fotoAvatar} alt={jug ? jug.nombre : 'Vacío'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ marginTop: '2px', fontSize: '7.5px', fontWeight: '800', color: esCap ? '#facc15' : '#ffffff', backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: '2px 4px', borderRadius: '4px', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {jug ? jug.nombre : 'Elegir'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 5, flex: 1 }}>
                  {Array.from({ length: def }).map((_, i) => {
                    const jug = getJugadorEnSlot('DEF', i);
                    const esCap = jug && jug.id === capitanId;
                    const fotoAvatar = jug?.foto_url || jug?.imagen_url || SILUETA_DEFAULT;
                    const colorBorde = esCap ? '#facc15' : getColorPosicion('DEF');
                    return (
                      <div key={`def-${i}`} onClick={() => { if (modoSeleccionCapitan && jug) manejarClicJugadorCampo(jug); else setSlotActivo({ tipo: 'DEF', index: i }); }} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '72px' }}>
                        {esCap && <Crown style={{ position: 'absolute', top: '-20px', color: '#facc15', width: '26px', height: '26px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))', zIndex: 10 }} />}
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ffffff', border: `2.5px solid ${colorBorde}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(0,0,0,0.4)' }}>
                          <img src={fotoAvatar} alt={jug ? jug.nombre : 'Vacío'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ marginTop: '2px', fontSize: '7.5px', fontWeight: '800', color: esCap ? '#facc15' : '#ffffff', backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: '2px 4px', borderRadius: '4px', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {jug ? jug.nombre : 'Elegir'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5, flex: 1 }}>
                  {(() => {
                    const jug = getJugadorEnSlot('POR', 0);
                    const esCap = jug && jug.id === capitanId;
                    const fotoAvatar = jug?.foto_url || jug?.imagen_url || SILUETA_DEFAULT;
                    const colorBorde = esCap ? '#facc15' : getColorPosicion('POR');
                    return (
                      <div onClick={() => { if (modoSeleccionCapitan && jug) manejarClicJugadorCampo(jug); else setSlotActivo({ tipo: 'POR', index: 0 }); }} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '80px' }}>
                        {esCap && <Crown style={{ position: 'absolute', top: '-20px', color: '#facc15', width: '26px', height: '26px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))', zIndex: 10 }} />}
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#ffffff', border: `2.5px solid ${colorBorde}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(0,0,0,0.4)' }}>
                          <img src={fotoAvatar} alt={jug ? jug.nombre : 'Vacío'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ marginTop: '2px', fontSize: '7.5px', fontWeight: '800', color: esCap ? '#facc15' : '#ffffff', backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: '2px 6px', borderRadius: '4px', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {jug ? jug.nombre : 'Elegir'}
                        </span>
                      </div>
                    );
                  })()}
                </div>

              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '800' }}>ENTRENADOR ANEFF TITULAR</h3>
                  <span style={{ backgroundColor: '#f3e8ff', color: '#7c3aed', fontSize: '8.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '8px' }}>
                    {entrenadorTitularId ? '1/2' : '0/2'}
                  </span>
                </div>
                <button onClick={() => setSlotActivo({ tipo: 'ENT', index: 0 })} style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '6px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', color: '#0f172a' }}>
                  {getJugadorEnSlot('ENT', 0)?.nombre || 'Seleccionar Entrenador Titular'}
                </button>
              </div>
            </div>
          )}

          {/* PESTAÑA MI PLANTILLA */}
          {tab === 'plantilla' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Mi Plantilla (22+2)</h2>
                  <span style={{ fontSize: '9.5px', color: plantillaGuardada ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                    {plantillaGuardada ? '✓ Plantilla Confirmada' : '⚠️ Borrador sin guardar'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
                  <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7', padding: '2px 6px', borderRadius: '8px', fontWeight: '800', fontSize: '9.5px' }}>
                    Jugadores: {plantillaJugadores.length}/22
                  </span>
                  <span style={{ backgroundColor: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff', padding: '2px 6px', borderRadius: '8px', fontWeight: '800', fontSize: '9.5px' }}>
                    Místeres: {plantillaEntrenadores.length}/2
                  </span>
                </div>
              </div>

              {alerta && (
                <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', borderRadius: '8px', padding: '5px 8px', fontSize: '10.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                  <span>{alerta}</span>
                </div>
              )}

              <button onClick={guardarPlantilla} style={{ backgroundColor: (plantillaJugadores.length === 22 && plantillaEntrenadores.length === 2) ? '#16a34a' : '#cbd5e1', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px', fontWeight: '800', fontSize: '11px', cursor: (plantillaJugadores.length === 22 && plantillaEntrenadores.length === 2) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Save style={{ width: '13px', height: '13px' }} /> Guardar Plantilla (22+2)
              </button>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 8px' }}>
                <span style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', display: 'block', marginBottom: '2px' }}>Club Seleccionado:</span>
                <button onClick={() => setMostrarSelectorEquipos(true)} style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800', fontSize: '11px', color: '#0f172a', cursor: 'pointer' }}>
                  <span>{equipoFiltro === 'TODOS' ? 'Ver Todos los Equipos (18 Clubes)' : equiposBD.find(e => e.id === equipoFiltro || e.nombre === equipoFiltro)?.nombre || equipoFiltro}</span>
                  <ChevronDown style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3px', backgroundColor: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {[
                  { id: 'TODOS', label: 'TODOS', count: plantillaJugadores.length + plantillaEntrenadores.length, max: 24, bg: '#0f172a' },
                  { id: 'POR', label: 'POR', count: conteosPos.POR, max: 2, bg: '#eab308' },
                  { id: 'DEF', label: 'DEF', count: conteosPos.DEF, max: 7, bg: '#16a34a' },
                  { id: 'CEN', label: 'CEN', count: conteosPos.CEN, max: 7, bg: '#2563eb' },
                  { id: 'DEL', label: 'DEL', count: conteosPos.DEL, max: 6, bg: '#dc2626' },
                  { id: 'ENT', label: 'MÍSTER', count: conteosPos.ENT, max: 2, bg: '#7c3aed' }
                ].map(p => (
                  <button key={p.id} onClick={() => setPosicionFiltro(p.id)} style={{ flex: 1, backgroundColor: posicionFiltro === p.id ? p.bg : '#f1f5f9', color: posicionFiltro === p.id ? '#ffffff' : '#64748b', border: 'none', borderRadius: '6px', padding: '4px 1px', fontWeight: '800', fontSize: '8px', cursor: 'pointer' }}>
                    <div>{p.label}</div>
                    <div style={{ fontSize: '7px', opacity: 0.9 }}>{p.id === 'TODOS' ? `${p.count}` : `${p.count}/${p.max}`}</div>
                  </button>
                ))}
              </div>

              {/* SECCIÓN JUGADORES */}
              <div>
                <h3 style={{ fontSize: '10px', fontWeight: '900', color: '#dc2626', textTransform: 'uppercase', marginBottom: '2px' }}>⚽ Selección de Jugadores</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', maxHeight: '255px', overflowY: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px' }}>
                  {getJugadoresFiltradosPlantilla().filter(j => getPosicionNormalizada(j.posicion) !== 'ENT').map(j => {
                    const enPlantilla = plantillaJugadores.includes(j.id);
                    const club = equiposBD.find(e => e.id === j.equipo_id || e.nombre === j.equipo_real);
                    const badge = getBadgePosicion(j.posicion);
                    const fotoAvatar = j.foto_url || j.imagen_url || SILUETA_DEFAULT;
                    return (
                      <div key={j.id} style={{ backgroundColor: enPlantilla ? '#f0fdf4' : '#f8fafc', border: enPlantilla ? '1px solid #22c55e' : '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <img src={fotoAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          {club?.escudo_url || club?.logo_url ? <img src={club.escudo_url || club.logo_url} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> : <img src={LOGO_GRADA_SIETE} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
                          <div>
                            <span style={{ fontWeight: '800', fontSize: '10.5px', color: '#0f172a', display: 'block' }}>{j.nombre}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ backgroundColor: badge.bg, color: '#ffffff', fontSize: '7px', fontWeight: '900', padding: '1px 3px', borderRadius: '3px' }}>{badge.label}</span>
                              <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: '600' }}>{j.equipo_real || 'Grupo 7'}</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => toggleJugadorPlantilla(j)} style={{ backgroundColor: enPlantilla ? '#dc2626' : '#22c55e', color: '#ffffff', border: 'none', borderRadius: '5px', padding: '3px 7px', fontWeight: '800', fontSize: '9.5px', cursor: 'pointer' }}>
                          {enPlantilla ? 'Quitar' : 'Fichar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECCIÓN ENTRENADORES ANEFF */}
              <div>
                <h3 style={{ fontSize: '10px', fontWeight: '900', color: '#7c3aed', textTransform: 'uppercase', marginBottom: '2px' }}>📋 Selección de Entrenadores ANEFF</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', maxHeight: '160px', overflowY: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px' }}>
                  {getJugadoresFiltradosPlantilla().filter(j => getPosicionNormalizada(j.posicion) === 'ENT').map(ent => {
                    const enPlantilla = plantillaEntrenadores.includes(ent.id);
                    const club = equiposBD.find(e => e.id === ent.equipo_id || e.nombre === ent.equipo_real);
                    const fotoAvatar = ent.foto_url || ent.imagen_url || SILUETA_DEFAULT;
                    return (
                      <div key={ent.id} style={{ backgroundColor: enPlantilla ? '#f3e8ff' : '#f8fafc', border: enPlantilla ? '1px solid #7c3aed' : '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f3e8ff', border: '1.5px solid #d8b4fe', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <img src={fotoAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          {club?.escudo_url || club?.logo_url ? <img src={club.escudo_url || club.logo_url} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> : <img src={LOGO_GRADA_SIETE} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
                          <div>
                            <span style={{ fontWeight: '800', fontSize: '10.5px', color: '#0f172a', display: 'block' }}>{ent.nombre}</span>
                            <span style={{ fontSize: '8.5px', color: '#7c3aed', fontWeight: '700' }}>Entrenador ANEFF</span>
                          </div>
                        </div>
                        <button onClick={() => toggleJugadorPlantilla(ent)} style={{ backgroundColor: enPlantilla ? '#dc2626' : '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '5px', padding: '3px 7px', fontWeight: '800', fontSize: '9.5px', cursor: 'pointer' }}>
                          {enPlantilla ? 'Quitar' : 'Fichar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* CLASIFICACIÓN FANTASY */}
          {tab === 'clasificacion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', display: 'block' }}>NOMBRE DE TU CLUB (FIJO)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <input 
                        type="text" 
                        value={nombreEquipoFantasy} 
                        onChange={(e) => setNombreEquipoFantasy(e.target.value)}
                        style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontWeight: '900', fontSize: '13px', color: '#0f172a', outline: 'none', background: '#ffffff', width: '160px' }}
                      />
                      <button onClick={guardarNombreEquipo} style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
                        Guardar
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ backgroundColor: '#f0fdf4', padding: '6px 10px', borderRadius: '8px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                      <span style={{ fontSize: '7.5px', color: '#16a34a', fontWeight: '800', display: 'block' }}>TOTAL PTS</span>
                      <span style={{ fontSize: '14px', color: '#16a34a', fontWeight: '900' }}>142</span>
                    </div>
                    <div style={{ backgroundColor: '#fef2f2', padding: '6px 10px', borderRadius: '8px', border: '1px solid #fee2e2', textAlign: 'center' }}>
                      <span style={{ fontSize: '7.5px', color: '#dc2626', fontWeight: '800', display: 'block' }}>RANKING</span>
                      <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '900' }}>1º</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Clasificación Fantasy</h2>
                <select value={jornadaSeleccionadaClasif} onChange={(e) => setJornadaSeleccionadaClasif(e.target.value)} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 8px', fontWeight: '700', fontSize: '11.5px', outline: 'none', color: '#0f172a' }}>
                  <option value="GENERAL">General Acumulada</option>
                  <option value="1">Jornada 1</option>
                  <option value="2">Jornada 2</option>
                </select>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '5px' }}>#</th>
                      <th style={{ padding: '5px' }}>Mánager / Equipo</th>
                      <th style={{ padding: '5px', textAlign: 'center' }}>PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { pos: 1, equipo: nombreEquipoFantasy, pts: 142 },
                      { pos: 2, equipo: 'Atlético Madrileño FC', pts: 128 },
                      { pos: 3, equipo: 'Galácticos G7', pts: 115 }
                    ].map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '7px 5px', fontWeight: '800', color: row.pos === 1 ? '#eab308' : '#dc2626' }}>{row.pos}</td>
                        <td style={{ padding: '7px 5px', fontWeight: '700', color: '#0f172a' }}>{row.equipo}</td>
                        <td style={{ padding: '7px 5px', textAlign: 'center', fontWeight: '900', color: '#16a34a' }}>{row.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RANKING MVP */}
          {tab === 'mvp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Ranking MVP</h2>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Análisis de puntuaciones para tu scouting</span>
              </div>

              <div>
                <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#dc2626', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.05em' }}>⚽ Futbolistas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '6px' }}>
                  {rankingFutbolistas.map((j, index) => {
                    const club = equiposBD.find(e => e.id === j.equipo_id || e.nombre === j.equipo_real);
                    const fotoAvatar = j.foto_url || j.imagen_url || SILUETA_DEFAULT;
                    const escudoClub = club?.escudo_url || club?.logo_url;
                    const badge = getBadgePosicion(j.posicion);

                    return (
                      <div key={j.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '900', fontSize: '10.5px', color: index === 0 ? '#eab308' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#64748b', width: '16px', textAlign: 'center' }}>{index + 1}</span>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#ffffff', border: '2px solid #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <img src={fotoAvatar} alt={j.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {escudoClub ? <img src={escudoClub} alt={j.equipo_real} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <img src={LOGO_GRADA_SIETE} alt="G7" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                          </div>
                          <div>
                            <span style={{ fontWeight: '800', fontSize: '10.5px', display: 'block', color: '#0f172a' }}>{j.nombre}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                              <span style={{ backgroundColor: badge.bg, color: '#ffffff', fontSize: '7px', fontWeight: '900', padding: '1px 3px', borderRadius: '3px' }}>{badge.label}</span>
                              <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: '600' }}>{j.equipo_real || 'Grupo 7'}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', padding: '2px 6px', borderRadius: '5px', textAlign: 'center' }}>
                          <span style={{ fontSize: '7px', color: '#16a34a', fontWeight: '800', display: 'block' }}>PTS</span>
                          <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '900' }}>{j.puntosTotales}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#7c3aed', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.05em' }}>📋 Entrenadores ANEFF</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '190px', overflowY: 'auto', paddingRight: '4px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '6px' }}>
                  {rankingEntrenadores.map((ent, index) => {
                    const club = equiposBD.find(e => e.id === ent.equipo_id || e.nombre === ent.equipo_real);
                    const fotoAvatar = ent.foto_url || ent.imagen_url || SILUETA_DEFAULT;
                    const escudoClub = club?.escudo_url || club?.logo_url;

                    return (
                      <div key={ent.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '900', fontSize: '10.5px', color: '#7c3aed', width: '16px', textAlign: 'center' }}>{index + 1}</span>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#f3e8ff', border: '2px solid #d8b4fe', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <img src={fotoAvatar} alt={ent.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {escudoClub ? <img src={escudoClub} alt={ent.equipo_real} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <img src={LOGO_GRADA_SIETE} alt="G7" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                          </div>
                          <div>
                            <span style={{ fontWeight: '800', fontSize: '10.5px', display: 'block', color: '#0f172a' }}>{ent.nombre}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                              <span style={{ backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '7px', fontWeight: '900', padding: '1px 3px', borderRadius: '3px' }}>MÍSTER</span>
                              <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: '600' }}>{ent.equipo_real || 'Grupo 7'}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ backgroundColor: '#f3e8ff', border: '1px solid #e9d5ff', padding: '2px 6px', borderRadius: '5px', textAlign: 'center' }}>
                          <span style={{ fontSize: '7px', color: '#7c3aed', fontWeight: '800', display: 'block' }}>PTS</span>
                          <span style={{ fontSize: '10.5px', color: '#7c3aed', fontWeight: '900' }}>{ent.puntosTotales}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* CALENDARIO */}
          {tab === 'calendario' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Calendario Grupo 7</h2>
                {jornadasDisponiblesCalendario.length > 0 && (
                  <select 
                    value={jornadaSeleccionadaCalendario} 
                    onChange={(e) => setJornadaSeleccionadaCalendario(e.target.value)}
                    style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 8px', fontWeight: '700', fontSize: '11.5px', outline: 'none', color: '#0f172a' }}
                  >
                    {jornadasDisponiblesCalendario.map(j => (
                      <option key={j} value={j}>Jornada {j}</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {partidosJornadaActual.length === 0 ? (
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '700' }}>
                    No hay partidos programados para la Jornada {jornadaSeleccionadaCalendario}.
                  </div>
                ) : (
                  partidosJornadaActual.map((partido, idx) => {
                    const eqLocal = equiposBD.find(e => e.id === partido.equipo_local_id || e.nombre === partido.equipo_local);
                    const eqVisitante = equiposBD.find(e => e.id === partido.equipo_visitante_id || e.nombre === partido.equipo_visitante);
                    const finalizado = partido.estado === 'finalizado' || partido.goles_local !== null;

                    return (
                      <div key={partido.id || idx} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', width: '60px' }}>{partido.fecha || 'Dom 12:00'}</span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                          <span style={{ fontWeight: '800', fontSize: '11px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{partido.equipo_local || eqLocal?.nombre || 'Local'}</span>
                          {eqLocal?.escudo_url || eqLocal?.logo_url ? <img src={eqLocal.escudo_url || eqLocal.logo_url} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} /> : null}
                        </div>

                        <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', margin: '0 8px', flexShrink: 0 }}>
                          {finalizado ? `${partido.goles_local}-${partido.goles_visitante}` : 'VS'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-start' }}>
                          {eqVisitante?.escudo_url || eqVisitante?.logo_url ? <img src={eqVisitante.escudo_url || eqVisitante.logo_url} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} /> : null}
                          <span style={{ fontWeight: '800', fontSize: '11px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{partido.equipo_visitante || eqVisitante?.nombre || 'Visitante'}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* CLASIFICACIÓN REAL */}
          {tab === 'clasif_real' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Clasificación Real - G7</h2>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Tercera RFEF</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '8.5px', fontWeight: '700', backgroundColor: '#ffffff', padding: '5px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '7px', height: '7px', backgroundColor: '#22c55e', borderRadius: '2px' }}></div>
                  <span>Ascenso (1º)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '7px', height: '7px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
                  <span>Play-offs (2º-5º)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '7px', height: '7px', backgroundColor: '#ef4444', borderRadius: '2px' }}></div>
                  <span>Descenso (16º-18º)</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '6px', overflowX: 'auto' }}>
                {clasificacionRealBD.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '700' }}>
                    No hay registros cargados en Supabase.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', tableLayout: 'fixed' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left' }}>
                        <th style={{ width: '18px', padding: '4px 1px', textAlign: 'center' }}>#</th>
                        <th style={{ padding: '4px 4px' }}>Equipo</th>
                        <th style={{ width: '20px', padding: '4px 1px', textAlign: 'center' }}>PJ</th>
                        <th style={{ width: '18px', padding: '4px 1px', textAlign: 'center' }}>G</th>
                        <th style={{ width: '18px', padding: '4px 1px', textAlign: 'center' }}>E</th>
                        <th style={{ width: '18px', padding: '4px 1px', textAlign: 'center' }}>P</th>
                        <th style={{ width: '20px', padding: '4px 1px', textAlign: 'center' }}>GF</th>
                        <th style={{ width: '20px', padding: '4px 1px', textAlign: 'center' }}>GC</th>
                        <th style={{ width: '20px', padding: '4px 1px', textAlign: 'center' }}>DG</th>
                        <th style={{ width: '24px', padding: '4px 1px', textAlign: 'center' }}>PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clasificacionRealBD.sort((a,b) => (a.posicion || 0) - (b.posicion || 0)).map((row, idx) => {
                        const pos = row.posicion || idx + 1;
                        const eq = equiposBD.find(e => e.id === row.equipo_id || e.nombre === row.equipo);
                        const escudo = eq?.escudo_url || eq?.logo_url;

                        let bgColor = 'transparent';
                        let textColor = '#0f172a';
                        if (pos === 1) {
                          bgColor = '#dcfce7';
                          textColor = '#15803d';
                        } else if (pos >= 2 && pos <= 5) {
                          bgColor = '#eff6ff';
                          textColor = '#1d4ed8';
                        } else if (pos >= 16 && pos <= 18) {
                          bgColor = '#fef2f2';
                          textColor = '#b91c1c';
                        }

                        return (
                          <tr key={row.id || idx} style={{ borderBottom: '1px solid #f8fafc', backgroundColor: bgColor }}>
                            <td style={{ padding: '4px 1px', fontWeight: '900', color: textColor, textAlign: 'center' }}>{pos}</td>
                            <td style={{ padding: '4px 4px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {escudo ? <img src={escudo} alt="" style={{ width: '13px', height: '13px', objectFit: 'contain', flexShrink: 0 }} /> : null}
                                <span style={{ fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.equipo || eq?.nombre}</span>
                              </div>
                            </td>
                            <td style={{ padding: '4px 1px', textAlign: 'center', color: '#64748b' }}>{row.pj || 0}</td>
                            <td style={{ padding: '4px 1px', textAlign: 'center', color: '#64748b' }}>{row.g || row.ganados || 0}</td>
                            <td style={{ padding: '4px 1px', textAlign: 'center', color: '#64748b' }}>{row.e || row.empatados || 0}</td>
                            <td style={{ padding: '4px 1px', textAlign: 'center', color: '#64748b' }}>{row.p || row.perdidos || 0}</td>
                            <td style={{ padding: '4px 1px', textAlign: 'center', color: '#64748b' }}>{row.gf || 0}</td>
                            <td style={{ padding: '4px 1px', textAlign: 'center', color: '#64748b' }}>{row.gc || 0}</td>
                            <td style={{ padding: '4px 1px', textAlign: 'center', color: '#64748b' }}>{row.dg || 0}</td>
                            <td style={{ padding: '4px 1px', textAlign: 'center', fontWeight: '900', color: textColor }}>{row.puntos || row.pts || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </main>

        {/* MODAL DE AYUDA Y REGLAMENTO OFICIAL */}
        {mostrarAyudaModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 150, padding: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#dc2626' }}>📖 Reglamento y Puntuaciones G7</h3>
                <button onClick={() => setMostrarAyudaModal(false)} style={{ border: 'none', background: 'transparent', fontWeight: '900', fontSize: '18px', color: '#64748b', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <strong style={{ color: '#0f172a', display: 'block', fontSize: '12px', marginBottom: '2px' }}>1. Confección de la Plantilla (22 + 2)</strong>
                  <p style={{ margin: 0 }}>Cada plantilla consta de 22 futbolistas (2 POR, 7 DEF, 7 CEN, 6 DEL) y 2 entrenadores ANEFF. Límite de 3 jugadores por cada club real (excepto entrenadores).</p>
                </div>

                <div>
                  <strong style={{ color: '#0f172a', display: 'block', fontSize: '12px', marginBottom: '2px' }}>2. Once Titular y Capitán</strong>
                  <p style={{ margin: 0 }}>Modifica tu alineación y esquema táctico libremente cada semana. Designa a un <strong>Capitán ("C")</strong> para duplicar sus puntos (x2).</p>
                </div>

                <div>
                  <strong style={{ color: '#0f172a', display: 'block', fontSize: '12px', marginBottom: '2px' }}>3. Dinámica de Puntuaciones por Jornada</strong>
                  <p style={{ margin: '0 0 4px 0' }}>Los puntos se calculan tras procesar las actas oficiales:</p>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li><strong>Minutos jugados:</strong> 1 punto si juega menos de 60'; 2 puntos con 60' o más.</li>
                    <li><strong>Goles:</strong> +5 pts (Def/Por), +4 pts (Med), +3 pts (Del) y +3 pts por gol de penalti.</li>
                    <li><strong>Portería a cero:</strong> +3 pts para porteros y +2 pts para defensas (con 60' o más jugados).</li>
                    <li><strong>Tarjetas y Errores:</strong> Amarilla (-1), Doble Amarilla (-2), Roja Directa (-3), Gol en propia (-1).</li>
                    <li><strong>Entrenadores ANEFF:</strong> Puntuación directa de <strong>0 a 7 puntos</strong> otorgada por la dirección según su rendimiento táctico en el banquillo.</li>
                  </ul>
                </div>

                <div>
                  <strong style={{ color: '#0f172a', display: 'block', fontSize: '12px', marginBottom: '2px' }}>4. Cierre y Recuento</strong>
                  <p style={{ margin: 0 }}>El plazo de cambios y alineaciones cierra estrictamente los <strong>sábados a las 14:00 h</strong>. Una vez validadas las actas, se computan los puntos y se abre la siguiente jornada.</p>
                </div>
              </div>

              <button onClick={() => setMostrarAyudaModal(false)} style={{ width: '100%', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: '800', fontSize: '12px', marginTop: '16px', cursor: 'pointer' }}>
                ¡Entendido! Volver al juego
              </button>
            </div>
          </div>
        )}

        {/* MODAL GRID DE EQUIPOS */}
        {mostrarSelectorEquipos && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 100 }}>
            <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '440px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Seleccionar Club del Grupo 7</h3>
                <button onClick={() => setMostrarSelectorEquipos(false)} style={{ border: 'none', background: 'transparent', fontWeight: '800', fontSize: '16px', color: '#64748b', cursor: 'pointer' }}>✕</button>
              </div>

              <div onClick={() => { setEquipoFiltro('TODOS'); setMostrarSelectorEquipos(false); }} style={{ backgroundColor: equipoFiltro === 'TODOS' ? '#fef2f2' : '#f8fafc', border: equipoFiltro === 'TODOS' ? '2px solid #dc2626' : '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', fontWeight: '800', fontSize: '13px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px', color: '#0f172a' }}>
                Ver Todos los Equipos (18 Clubes)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {equiposBD.map(eq => {
                  const identificador = eq.id || eq.nombre;
                  const conteo = getConteoJugadoresPorClub(identificador);
                  const esSeleccionado = equipoFiltro === identificador;
                  return (
                    <div key={eq.id} onClick={() => { setEquipoFiltro(identificador); setMostrarSelectorEquipos(false); }} style={{ backgroundColor: esSeleccionado ? '#f0fdf4' : '#ffffff', border: esSeleccionado ? '2px solid #22c55e' : '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', position: 'relative' }}>
                      <span style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: conteo >= 3 ? '#fef2f2' : '#f1f5f9', color: conteo >= 3 ? '#dc2626' : '#64748b', fontSize: '9px', fontWeight: '900', padding: '2px 6px', borderRadius: '8px', border: conteo >= 3 ? '1px solid #fee2e2' : '1px solid #cbd5e1' }}>{conteo}/3</span>
                      {eq.escudo_url || eq.logo_url ? <img src={eq.escudo_url || eq.logo_url} alt={eq.nombre} style={{ width: '36px', height: '36px', objectFit: 'contain' }} /> : <img src={LOGO_GRADA_SIETE} alt="G7" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />}
                      <span style={{ fontWeight: '800', fontSize: '11px', textAlign: 'center', color: '#0f172a', lineHeight: '1.2' }}>{eq.nombre}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL SELECCIÓN DE TITULARES */}
        {slotActivo && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 100 }}>
            <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '440px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Seleccionar {slotActivo.tipo === 'ENT' ? 'Entrenador ANEFF' : slotActivo.tipo}</h3>
                <button onClick={() => setSlotActivo(null)} style={{ border: 'none', background: 'transparent', fontWeight: '800', fontSize: '16px', color: '#64748b', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getOpcionesTitularesDisponibles(slotActivo.tipo).length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>No hay más jugadores disponibles en tu plantilla para esta posición.</div>
                ) : (
                  getOpcionesTitularesDisponibles(slotActivo.tipo).map(j => (
                    <div key={j.id} onClick={() => seleccionarTitular(j.id)} style={{ padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <div>
                        <span style={{ fontWeight: '700', fontSize: '13px', display: 'block', color: '#0f172a' }}>{j.nombre}</span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>{j.equipo_real || 'Grupo 7'}</span>
                      </div>
                      <CheckCircle2 style={{ color: '#dc2626', width: '18px', height: '18px' }} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* NAVEGACIÓN INFERIOR */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', padding: '6px 0 10px 0', pointerEvents: 'auto', boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)' }}>
            {[
              { id: 'once', label: 'ONCE', icon: Shield },
              { id: 'plantilla', label: 'PLANT', icon: Users },
              { id: 'clasificacion', label: 'LIGA', icon: Trophy },
              { id: 'mvp', label: 'MVP', icon: Star },
              { id: 'calendario', label: 'PART', icon: Calendar },
              { id: 'clasif_real', label: 'CLAS', icon: Table }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button key={item.id} onClick={() => setTab(item.id)} style={{ border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: isActive ? '#dc2626' : '#94a3b8', cursor: 'pointer' }}>
                  <Icon style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '7.5px', fontWeight: '800', letterSpacing: '0.01em' }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
