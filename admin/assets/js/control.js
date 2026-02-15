$(document).ready(function() {
    let tablaControl;
    const esLider = $('#es_lider').val() === '1';
    const esSuperAdmin = $('#es_superadmin').val() === '1';
    let filtroActual = 'todos';

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
        { data: 'id_votante' },
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
                const clase = yaVoto ? 'btn-secondary' : 'btn-success';
                const icono = yaVoto ? 'fa-rotate-left' : 'fa-check';
                const texto = yaVoto ? 'Quitar marca' : 'Marcar votó';

                return `
                    <button class="btn btn-sm ${clase}" onclick="toggleChequeado(${data.id_votante}, ${data.chequeado}, '${(data.nombres + ' ' + data.apellidos).replace(/'/g, "\\'")}')">
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

        if (filtroActual === 'todos') {
            return true;
        }

        return chequeado === filtroActual;
    });

    $('[data-filtro]').on('click', function() {
        filtroActual = $(this).data('filtro');
        $('[data-filtro]').removeClass('active');
        $(this).addClass('active');
        tablaControl.draw();
    });

    window.toggleChequeado = function(idVotante, chequeado, nombreCompleto) {
        const yaVoto = parseInt(chequeado, 10) === 2;

        Swal.fire({
            title: yaVoto ? '¿Quitar marca de voto?' : '¿Estás seguro de marcar YA VOTÓ?',
            text: nombreCompleto,
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
                    id_votante: idVotante
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
