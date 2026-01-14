export const validateChillerReading = (data) => {
  const errors = [];

  if (!data.site_id) {
    errors.push("site_id is required");
  }

  if (!data.chiller_id) {
    errors.push("chiller_id is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const formatChillerReadingForInsert = (data) => {
  return {
    log_id: data.log_id || null,
    site_id: data.site_id,
    chiller_id: data.chiller_id,
    equipment_id: data.equipment_id || null,
    date_shift: data.date_shift || null,
    executor_id: data.executor_id || null,
    reading_time: data.reading_time || null,
    condenser_inlet_temp: data.condenser_inlet_temp || null,
    condenser_outlet_temp: data.condenser_outlet_temp || null,
    evaporator_inlet_temp: data.evaporator_inlet_temp || null,
    evaporator_outlet_temp: data.evaporator_outlet_temp || null,
    compressor_suction_temp: data.compressor_suction_temp || null,
    motor_temperature: data.motor_temperature || null,
    saturated_condenser_temp: data.saturated_condenser_temp || null,
    saturated_suction_temp: data.saturated_suction_temp || null,
    discharge_pressure: data.discharge_pressure || null,
    main_suction_pressure: data.main_suction_pressure || null,
    oil_pressure: data.oil_pressure || null,
    oil_pressure_difference: data.oil_pressure_difference || null,
    condenser_inlet_pressure: data.condenser_inlet_pressure || null,
    condenser_outlet_pressure: data.condenser_outlet_pressure || null,
    evaporator_inlet_pressure: data.evaporator_inlet_pressure || null,
    evaporator_outlet_pressure: data.evaporator_outlet_pressure || null,
    compressor_load_percent: data.compressor_load_percent || null,
    inline_btu_meter: data.inline_btu_meter || null,
    set_point: data.set_point || null,
    start_datetime: data.start_datetime || null,
    end_datetime: data.end_datetime || null,
    remarks: data.remarks || null,
    sla_status: data.sla_status || null,
    reviewed_by: data.reviewed_by || null,
    signature_text: data.signature_text || null,
    attachments: data.attachments || null,
  };
};

export default {
  validateChillerReading,
  formatChillerReadingForInsert,
};
