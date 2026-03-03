$(document).ready(function() {
    let tablaControl;
    const esLider = $('#es_lider').val() === '1';
    const esSuperAdmin = $('#es_superadmin').val() === '1';
    let filtroActual = 'todos';
    let filtroTipoActual = 'todos';

    function actualizarResumen(datos) {
        const lista = Array.isArray(datos) ? datos : [];
        const total = lista.length;
        const yaVotaron = lista.filter((item) => parseInt(item.chequeado, 10) === 2).length;
        const sinVotar = total - yaVotaron;

        $('#totalVotantesControl').text(total);
        $('#totalSinVotarControl').text(sinVotar);
        $('#totalYaVotoControl').text(yaVotaron);
    }

    let columns = [
        {
            data: 'id_registro',
            render: function(data, type, row) {
                if (parseInt(row.es_lider_registro, 10) === 1) {
                    return `<span class="fw-semibold">${data}</span> <span class="badge bg-info text-dark">LÍDER</span>`;
                }
                return data;
            }
        },
        { data: 'nombres' },
        { data: 'apellidos' },
        { data: 'identificacion' },
        { data: 'nombre_tipo' },
        {
            data: 'telefono',
            render: function(data) {
                return data ? data : '';
            }
        },
        {
            data: 'sexo',
            render: function(data) {
                return data === 'M' ? 'Masculino' : (data === 'F' ? 'Femenino' : 'Otro');
            }
        },
        {
            data: 'mesa',
            render: function(data) {
                return data ? data : 0;
            }
        },
        {
            data: 'lugar_mesa',
            render: function(data) {
                return data ? data : '';
            }
        }
    ];

    if (!esLider) {
        columns.push({
            data: null,
            render: function(data) {
                if (parseInt(data.es_lider_registro, 10) === 1) {
                    if (data.admin_directo) {
                        return '<span class="badge bg-primary">' + data.admin_directo + '</span>';
                    }
                    return '<span class="badge bg-info text-dark">Registro líder</span>';
                }

                if (data.lider_nombres && data.lider_apellidos) {
                    return '<span class="badge bg-info">' + data.lider_nombres + ' ' + data.lider_apellidos + '</span>';
                }

                if (data.admin_directo) {
                    return '<span class="badge bg-primary">Por ' + data.admin_directo + '</span>';
                }

                return '<span class="badge bg-secondary">Sin asignar</span>';
            }
        });
    }

    if (esSuperAdmin) {
        columns.push({
            data: 'admin_propietario',
            render: function(data) {
                return data ? '<span class="badge bg-dark">' + data + '</span>' : '<span class="badge bg-secondary">N/A</span>';
            }
        });
    }

    columns.push(
        {
            data: 'chequeado',
            render: function(data) {
                return parseInt(data, 10) === 2
                    ? '<span class="badge bg-success">YA VOTÓ</span>'
                    : '<span class="badge bg-warning text-dark">SIN VOTAR</span>';
            }
        },
        {
            data: null,
            orderable: false,
            searchable: false,
            render: function(data) {
                const yaVoto = parseInt(data.chequeado, 10) === 2;
                const esRegistroLider = parseInt(data.es_lider_registro, 10) === 1;
                const clase = yaVoto ? 'btn-secondary' : 'btn-success';
                const icono = yaVoto ? 'fa-rotate-left' : 'fa-check';
                const texto = yaVoto ? 'Quitar marca' : 'Marcar votó';
                const idRegistro = parseInt(data.id_registro, 10) || parseInt(data.id_votante, 10);
                const tipoRegistro = esRegistroLider ? 'lider' : 'votante';

                return `
                    <button class="btn btn-sm ${clase}" onclick="toggleChequeado(${idRegistro}, ${data.chequeado}, '${(data.nombres + ' ' + data.apellidos).replace(/'/g, "\\'")}', '${tipoRegistro}')">
                        <i class="fas ${icono}"></i> ${texto}
                    </button>
                `;
            }
        }
    );

    tablaControl = $('#tablaControl').DataTable({
        ajax: {
            url: '../controllers/control_controller.php',
            type: 'POST',
            data: { action: 'listar' },
            dataSrc: function(response) {
                if (!response || response.success === false) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: (response && response.message) ? response.message : 'No se pudo cargar la información'
                    });
                    return [];
                }

                const data = Array.isArray(response.data) ? response.data : [];
                actualizarResumen(data);
                return data;
            },
            error: function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Error del servidor',
                    text: 'No fue posible cargar el listado de control'
                });
            }
        },
        columns: columns,
        responsive: true,
        processing: true,
        serverSide: false,
        order: [[0, 'desc']],
        pageLength: 10,
        lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        drawCallback: function() {
            const visibles = tablaControl.rows({ search: 'applied' }).data().toArray();
            actualizarResumen(visibles);
        },
        createdRow: function(row, data) {
            if (parseInt(data.es_lider_registro, 10) === 1) {
                $(row).addClass('fila-lider-control');
                if (parseInt(data.chequeado, 10) === 2) {
                    $(row).addClass('fila-lider-control-ya-voto');
                }
                return;
            }

            if (parseInt(data.chequeado, 10) === 2) {
                $(row).addClass('table-success');
            }
        }
    });

    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        if (settings.nTable.id !== 'tablaControl') {
            return true;
        }

        const fila = settings.aoData[dataIndex]?._aData;
        if (!fila) {
            return true;
        }

        const chequeado = parseInt(fila.chequeado, 10) === 2 ? 'ya_voto' : 'sin_votar';
        const tipoRegistro = parseInt(fila.es_lider_registro, 10) === 1 ? 'lider' : 'votante';

        const cumpleEstado = filtroActual === 'todos' ? true : chequeado === filtroActual;
        const cumpleTipo = filtroTipoActual === 'todos' ? true : tipoRegistro === filtroTipoActual;

        return cumpleEstado && cumpleTipo;
    });

    $('[data-filtro]').on('click', function() {
        filtroActual = $(this).data('filtro');
        $('[data-filtro]').removeClass('active');
        $(this).addClass('active');
        tablaControl.draw();
    });

    $('[data-filtro-tipo]').on('click', function() {
        filtroTipoActual = $(this).data('filtro-tipo');
        $('[data-filtro-tipo]').removeClass('active');
        $(this).addClass('active');
        tablaControl.draw();
    });

    window.toggleChequeado = function(idVotante, chequeado, nombreCompleto, tipoRegistro = 'votante') {
        const yaVoto = parseInt(chequeado, 10) === 2;
        const etiqueta = tipoRegistro === 'lider' ? 'líder' : 'votante';

        Swal.fire({
            title: yaVoto ? '¿Quitar marca de voto?' : '¿Estás seguro de marcar YA VOTÓ?',
            text: `${nombreCompleto} (${etiqueta})`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: yaVoto ? '#6b7280' : '#16a34a',
            cancelButtonColor: '#ef4444',
            confirmButtonText: yaVoto ? 'Sí, quitar marca' : 'Sí, marcar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            $.ajax({
                url: '../controllers/control_controller.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'marcar_chequeado',
                    id_votante: idVotante,
                    tipo_registro: tipoRegistro
                },
                success: function(response) {
                    if (response && response.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Actualizado',
                            text: response.message,
                            timer: 1800,
                            showConfirmButton: false
                        });
                        tablaControl.ajax.reload(function() {
                            tablaControl.draw(false);
                        }, false);
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: response.message || 'No fue posible actualizar el estado'
                        });
                    }
                },
                error: function() {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No fue posible actualizar el estado del votante'
                    });
                }
            });
        });
    };
});

function exportarControlExcel() {
    window.location.href = '../controllers/control_controller.php?action=exportar_control';
}
// Funcionalidad de Consulta por Cédula
$(document).ready(function() {
    // Validar que solo se acepten números en el campo de cédula
    $('#cedulaConsulta').on('keypress', function(e) {
        const char = String.fromCharCode(e.which);
        if (!/[0-9]/.test(char)) {
            e.preventDefault();
        }
    }).on('paste', function(e) {
        e.preventDefault();
        const texto = (e.originalEvent?.clipboardData || window.clipboardData).getData('text');
        if (/^\d+$/.test(texto)) {
            $(this).val(texto);
        }
    });

    // Botón de consulta
    $('#btnConsultarCedula').on('click', function() {
        const cedula = $('#cedulaConsulta').val().trim();
        
        if (!cedula) {
            Swal.fire({
                icon: 'warning',
                title: 'Ingrese una cédula',
                text: 'Por favor ingrese un número de cédula para consultar'
            });
            return;
        }

        $.ajax({
            url: '../controllers/control_controller.php',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'consultar_cedula',
                cedula: cedula
            },
            success: function(response) {
                if (response.success && response.data) {
                    mostrarModalConsulta(response.data);
                } else {
                    Swal.fire({
                        icon: 'info',
                        title: 'No encontrado',
                        text: response.message || 'No se encontró ningún registro con esa cédula.'
                    });
                }
            },
            error: function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al consultar la cédula'
                });
            }
        });
    });

    // Permitir buscar con Enter
    $('#cedulaConsulta').on('keydown', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            $('#btnConsultarCedula').click();
        }
    });
});

function ctype_digit(str) {
    return /^\d+$/.test(str);
}

function mostrarModalConsulta(data) {
    const tipoRegistro = data.tipo_registro || '';
    const esLider = tipoRegistro === 'lider';
    const yaVoto = parseInt(data.chequeado) === 2;
    
    let html = '<div class="table-responsive">';
    html += '<table class="table table-sm table-borderless">';
    
    // Información básica
    html += '<tr><td class="fw-semibold">Cédula:</td><td>' + (data.identificacion || 'N/A') + '</td></tr>';
    html += '<tr><td class="fw-semibold">Nombres:</td><td>' + (data.nombres || 'N/A') + '</td></tr>';
    html += '<tr><td class="fw-semibold">Apellidos:</td><td>' + (data.apellidos || 'N/A') + '</td></tr>';
    html += '<tr><td class="fw-semibold">Tipo ID:</td><td>' + (data.nombre_tipo || 'N/A') + '</td></tr>';
    
    // Mesa y lugar
    if (data.mesa !== null && data.mesa !== '' && data.mesa !== undefined) {
        html += '<tr><td class="fw-semibold">Mesa:</td><td>' + (data.mesa || 'N/A') + '</td></tr>';
    }
    
    if (data.lugar_mesa !== null && data.lugar_mesa !== '' && data.lugar_mesa !== undefined) {
        html += '<tr><td class="fw-semibold">Lugar Mesa:</td><td>' + (data.lugar_mesa || 'N/A') + '</td></tr>';
    }
    
    // Tipo de registro
    if (esLider) {
        html += '<tr><td class="fw-semibold">Tipo:</td><td><span class="badge bg-info text-dark">LÍDER</span></td></tr>';
    } else {
        html += '<tr><td class="fw-semibold">Tipo:</td><td><span class="badge bg-secondary">VOTANTE</span></td></tr>';
    }
    
    // Información de líder/administrador
    if (esLider) {
        html += '<tr><td class="fw-semibold">Registrado por:</td><td>' + 
                (data.propietario_nombres ? (data.propietario_nombres + ' ' + (data.propietario_apellidos || '')).trim() : 'N/A') + 
                '</td></tr>';
    } else {
        // Si es votante, mostrar si tiene un líder
        if (data.lider_nombres && data.lider_apellidos) {
            html += '<tr><td class="fw-semibold">Líder:</td><td>' + (data.lider_nombres + ' ' + data.lider_apellidos).trim() + '</td></tr>';
        }
        
        // Mostrar administrador
        if (data.admin_nombres && data.admin_nombres !== 'N/A') {
            html += '<tr><td class="fw-semibold">Registrado por:</td><td>' + 
                    (data.admin_nombres + ' ' + (data.admin_apellidos || '')).trim() + 
                    '</td></tr>';
        } else if (data.propietario_nombres) {
            html += '<tr><td class="fw-semibold">Administrador:</td><td>' + 
                    (data.propietario_nombres + ' ' + (data.propietario_apellidos || '')).trim() + 
                    '</td></tr>';
        }
    }
    
    // Estado de voto
    html += '<tr><td class="fw-semibold">Estado de Voto:</td><td>';
    if (yaVoto) {
        html += '<span class="badge bg-success">YA VOTÓ</span>';
    } else {
        html += '<span class="badge bg-warning text-dark">SIN VOTAR</span>';
    }
    html += '</td></tr>';
    
    html += '</table>';
    html += '</div>';
    
    $('#modalConsultaContenido').html(html);
    
    const modalElement = new bootstrap.Modal(document.getElementById('modalConsultaCedula'));
    modalElement.show();
    
    // Limpiar el campo después de mostrar
    $('#cedulaConsulta').val('');
}