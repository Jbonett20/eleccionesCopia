<?php
/**
 * Control de Asistencia al Voto
 * Lista votantes y permite marcar/desmarcar si ya votó.
 */

require_once '../config/db.php';
require_once '../config/session.php';

requerirRol([1, 2, 3]); // SuperAdmin, Admin, Líder

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action !== 'exportar_control') {
    header('Content-Type: application/json; charset=utf-8');
}

switch ($action) {
    case 'listar':
        listarControlVotantes();
        break;
    case 'marcar_chequeado':
        marcarChequeado();
        break;
    case 'exportar_control':
        exportarControl();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}

function obtenerIdLiderDesdeSesion($usuario_id) {
    try {
        $idLider = DB::queryOneValue(
            "SELECT l.id_lider
             FROM lideres l
             INNER JOIN usuarios u ON u.identificacion = l.identificacion
             WHERE u.id_usuario = ?
             LIMIT 1",
            $usuario_id
        );

        if (!empty($idLider)) {
            return (int)$idLider;
        }
    } catch (Exception $e) {
        error_log('No se pudo resolver líder por identificación: ' . $e->getMessage());
    }

    $usuario_username = $_SESSION['usuario'] ?? $_SESSION['usuario_username'] ?? '';
    if (!empty($usuario_username)) {
        try {
            $idLider = DB::queryOneValue(
                "SELECT id_lider FROM lideres WHERE usuario = ? LIMIT 1",
                $usuario_username
            );
            if (!empty($idLider)) {
                return (int)$idLider;
            }
        } catch (Exception $e) {
            error_log('No se pudo resolver líder por usuario: ' . $e->getMessage());
        }
    }

    return null;
}

function obtenerCondicionAcceso($usuario_id, $usuario_rol, &$params, $alias = 'v') {
    if ($usuario_rol == 1) {
        return '1=1';
    }

    if ($usuario_rol == 2) {
        $params[] = $usuario_id;
        $params[] = $usuario_id;
        return "(l.id_usuario_creador = ? OR {$alias}.id_administrador_directo = ?)";
    }

    $idLider = obtenerIdLiderDesdeSesion($usuario_id);
    if (!$idLider) {
        return '0=1';
    }

    $params[] = $idLider;
    return "{$alias}.id_lider = ?";
}

function listarControlVotantes() {
    try {
        $usuario_id = $_SESSION['usuario_id'];
        $usuario_rol = $_SESSION['usuario_rol'];

        $params = [];
        $condicionAcceso = obtenerCondicionAcceso($usuario_id, $usuario_rol, $params);

        $query = "SELECT v.id_votante, v.nombres, v.apellidos, v.identificacion, v.telefono, v.sexo,
                 v.mesa, v.lugar_mesa, COALESCE(v.chequeado, 1) AS chequeado,
                         t.nombre_tipo,
                         l.id_lider, l.nombres AS lider_nombres, l.apellidos AS lider_apellidos,
                         CONCAT(u_admin.nombres, ' ', u_admin.apellidos) AS admin_directo,
                         CONCAT(u_prop.nombres, ' ', u_prop.apellidos) AS admin_propietario
                  FROM votantes v
                  INNER JOIN tipos_identificacion t ON v.id_tipo_identificacion = t.id_tipo_identificacion
                  LEFT JOIN lideres l ON v.id_lider = l.id_lider
                  LEFT JOIN usuarios u_admin ON v.id_administrador_directo = u_admin.id_usuario
                  LEFT JOIN usuarios u_prop ON u_prop.id_usuario = COALESCE(v.id_administrador_directo, l.id_usuario_creador)
                  WHERE v.id_estado = 1
                    AND {$condicionAcceso}
                  ORDER BY v.id_votante DESC";

        $votantes = DB::queryAllRows($query, ...$params);

        if (!is_array($votantes)) {
            $votantes = [];
        }

        echo json_encode(['success' => true, 'data' => $votantes]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error al listar control: ' . $e->getMessage()]);
    }
}

function marcarChequeado() {
    try {
        $id_votante = isset($_POST['id_votante']) ? (int)$_POST['id_votante'] : 0;
        if ($id_votante <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de votante inválido']);
            return;
        }

        $usuario_id = $_SESSION['usuario_id'];
        $usuario_rol = $_SESSION['usuario_rol'];

        $params = [];
        $condicionAcceso = obtenerCondicionAcceso($usuario_id, $usuario_rol, $params);

        $query = "SELECT v.id_votante, v.chequeado
                  FROM votantes v
                  LEFT JOIN lideres l ON v.id_lider = l.id_lider
                  WHERE v.id_votante = ?
                    AND v.id_estado = 1
                    AND {$condicionAcceso}
                  LIMIT 1";

        $votante = DB::queryFirstRow($query, $id_votante, ...$params);

        if (!$votante) {
            echo json_encode(['success' => false, 'message' => 'No tienes permisos para este votante o no existe']);
            return;
        }

        $chequeado_actual = (int)($votante['chequeado'] ?? 1);
        $nuevo_estado = ($chequeado_actual === 2) ? 1 : 2;

        DB::update('votantes', [
            'chequeado' => $nuevo_estado,
            'fecha_edicion' => date('Y-m-d H:i:s')
        ], 'id_votante = ?', $id_votante);

        $mensaje = $nuevo_estado === 2
            ? 'Votante marcado como: YA VOTÓ'
            : 'Marca removida. El votante queda como: SIN VOTAR';

        echo json_encode([
            'success' => true,
            'message' => $mensaje,
            'chequeado' => $nuevo_estado
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar estado: ' . $e->getMessage()]);
    }
}

function exportarControl() {
    $usuario_id = $_SESSION['usuario_id'];
    $usuario_rol = $_SESSION['usuario_rol'];

    $params = [];
    $condicionAcceso = obtenerCondicionAcceso($usuario_id, $usuario_rol, $params);

    $query = "SELECT v.id_votante, v.nombres, v.apellidos, v.identificacion, t.nombre_tipo,
                     v.telefono, v.sexo, v.mesa, v.lugar_mesa,
                     CONCAT(l.nombres, ' ', l.apellidos) AS lider_nombre,
                     CONCAT(u_admin.nombres, ' ', u_admin.apellidos) AS admin_directo,
                     CONCAT(u_prop.nombres, ' ', u_prop.apellidos) AS admin_propietario,
                     COALESCE(v.chequeado, 1) AS chequeado
              FROM votantes v
              INNER JOIN tipos_identificacion t ON v.id_tipo_identificacion = t.id_tipo_identificacion
              LEFT JOIN lideres l ON v.id_lider = l.id_lider
              LEFT JOIN usuarios u_admin ON v.id_administrador_directo = u_admin.id_usuario
              LEFT JOIN usuarios u_prop ON u_prop.id_usuario = COALESCE(v.id_administrador_directo, l.id_usuario_creador)
              WHERE v.id_estado = 1
                AND {$condicionAcceso}
              ORDER BY v.id_votante DESC";

    $votantes = DB::queryAllRows($query, ...$params);

    while (ob_get_level()) {
        ob_end_clean();
    }

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="control_votantes_' . date('Y-m-d_His') . '.csv"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

    fputcsv($output, [
        'ID', 'Nombres', 'Apellidos', 'Identificación', 'Tipo ID', 'Teléfono', 'Sexo',
        'Mesa', 'Lugar Mesa', 'Líder', 'Admin Directo', 'Administrador', 'Estado Voto'
    ], ';');

    foreach ($votantes as $votante) {
        fputcsv($output, [
            $votante['id_votante'],
            $votante['nombres'],
            $votante['apellidos'],
            $votante['identificacion'],
            $votante['nombre_tipo'],
            $votante['telefono'] ?? '',
            $votante['sexo'] == 'M' ? 'Masculino' : ($votante['sexo'] == 'F' ? 'Femenino' : 'Otro'),
            $votante['mesa'] ?: 0,
            $votante['lugar_mesa'] ?? '',
            $votante['lider_nombre'] ?: 'Sin líder',
            $votante['admin_directo'] ?: 'N/A',
            $votante['admin_propietario'] ?: 'N/A',
            ((int)($votante['chequeado'] ?? 1) === 2) ? 'YA VOTÓ' : 'SIN VOTAR'
        ], ';');
    }

    fclose($output);
    exit;
}
