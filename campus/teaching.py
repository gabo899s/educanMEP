"""Validación docente: plantillas, rúbricas y formularios condicionales."""
import math
import re
from decimal import Decimal, ROUND_HALF_UP


def short(value, label, limit=200, required=True):
    if not isinstance(value, str) or len(value.strip()) > limit or (required and not value.strip()):
        raise ValueError(f'Revisa {label}: máximo {limit} caracteres.')
    return value.strip()


def identifier(value):
    if not isinstance(value, str) or not re.fullmatch(r'[a-z][a-z0-9_]{0,49}', value):
        raise ValueError('El identificador del criterio o campo no es válido.')
    return value


def number(value, label, low=0, high=1000000):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
        raise ValueError(f'{label} debe ser un número entre {low} y {high}.')
    return value


def rubric_schema(value):
    if value == {}:
        return {}
    if not isinstance(value, dict):
        raise ValueError('La rúbrica debe contener un título y criterios.')
    title = short(value.get('title'), 'el nombre de la rúbrica', 120)
    criteria = value.get('criteria')
    if not isinstance(criteria, list) or not 1 <= len(criteria) <= 10:
        raise ValueError('La rúbrica necesita entre 1 y 10 criterios.')
    result, ids = [], set()
    for c in criteria:
        if not isinstance(c, dict):
            raise ValueError('Revisa los criterios de la rúbrica.')
        cid = identifier(c.get('id'))
        if cid in ids:
            raise ValueError('No repitas criterios en la rúbrica.')
        ids.add(cid)
        levels = c.get('levels')
        if not isinstance(levels, list) or not 2 <= len(levels) <= 5:
            raise ValueError('Cada criterio necesita entre 2 y 5 niveles.')
        normalized, level_ids, scores = [], set(), set()
        for level in levels:
            if not isinstance(level, dict):
                raise ValueError('Revisa los niveles de la rúbrica.')
            lid = identifier(level.get('id'))
            points = number(level.get('points'), 'Los puntos del nivel', 0, 1000)
            if int(points) != points or lid in level_ids or points in scores:
                raise ValueError('Usa niveles únicos y puntos enteros diferentes.')
            level_ids.add(lid); scores.add(points)
            normalized.append({'id': lid, 'label': short(level.get('label'), 'el nivel', 80),
                               'description': short(level.get('description', ''), 'la descripción del nivel', 500, False), 'points': int(points)})
        if min(scores) != 0 or max(scores) == 0:
            raise ValueError('Incluye un nivel de 0 puntos y un máximo mayor que 0 en cada criterio.')
        result.append({'id': cid, 'title': short(c.get('title'), 'el criterio', 100),
                       'description': short(c.get('description', ''), 'la descripción del criterio', 500, False),
                       'levels': sorted(normalized, key=lambda l: -l['points'])})
    maximum = sum(max(l['points'] for l in c['levels']) for c in result)
    if maximum > 1000:
        raise ValueError('La suma máxima de la rúbrica no puede superar 1000 puntos.')
    return {'title': title, 'criteria': result}


def fields_schema(value):
    if not isinstance(value, list) or len(value) > 12:
        raise ValueError('Puedes añadir hasta 12 campos por formulario.')
    result, known = [], {}
    for f in value:
        if not isinstance(f, dict):
            raise ValueError('Revisa los campos del formulario.')
        fid = identifier(f.get('id'))
        if fid in known:
            raise ValueError('No repitas campos en el formulario.')
        kind = f.get('type')
        if kind not in {'text', 'textarea', 'number', 'choice', 'checkbox'}:
            raise ValueError('Selecciona un tipo de campo válido.')
        required = f.get('required', False)
        if not isinstance(required, bool):
            raise ValueError('Indica si el campo es obligatorio.')
        field = {'id': fid, 'label': short(f.get('label'), 'el nombre del campo', 100), 'type': kind,
                 'help': short(f.get('help', ''), 'la ayuda del campo', 200, False), 'required': required}
        if kind == 'choice':
            choices = f.get('options')
            if not isinstance(choices, list) or not 2 <= len(choices) <= 20:
                raise ValueError('Un campo de opciones necesita entre 2 y 20 opciones.')
            field['options'] = [short(o, 'la opción', 100) for o in choices]
            if len(set(field['options'])) != len(choices):
                raise ValueError('No repitas opciones en un campo.')
        if kind == 'number':
            for key in ['min', 'max']:
                if f.get(key) is not None:
                    field[key] = number(f[key], 'El límite del campo', -1000000, 1000000)
            if field.get('min', -1000000) > field.get('max', 1000000):
                raise ValueError('El mínimo no puede superar el máximo.')
        condition = f.get('show_if')
        if condition:
            if not isinstance(condition, dict):
                raise ValueError('Revisa la condición del campo.')
            source = known.get(condition.get('field'))
            expected = condition.get('equals')
            if not source or source['type'] not in {'choice', 'checkbox'}:
                raise ValueError('La condición debe depender de una opción o casilla anterior.')
            if source['type'] == 'checkbox' and not isinstance(expected, bool) or source['type'] == 'choice' and expected not in source['options']:
                raise ValueError('Elige una respuesta válida para activar el campo.')
            field['show_if'] = {'field': source['id'], 'equals': expected}
        known[fid] = field; result.append(field)
    return result


def field_answers(schema, answers, complete=True):
    if not isinstance(answers, dict) or set(answers) - {f['id'] for f in schema}:
        raise ValueError('Las respuestas contienen campos no válidos.')
    result = {}
    for f in schema:
        key, kind = f['id'], f['type']
        condition = f.get('show_if')
        if condition and (condition['field'] not in result or result[condition['field']] != condition['equals']):
            continue
        value = answers.get(key)
        empty = value is None or value == ''
        if complete and f['required'] and (empty or kind == 'checkbox' and value is not True):
            raise ValueError(f'Completa el campo «{f["label"]}».')
        if empty:
            continue
        if kind in {'text', 'textarea'}:
            value = short(value, f['label'], 3000 if kind == 'textarea' else 300, False)
            if complete and f['required'] and not value:
                raise ValueError(f'Completa el campo «{f["label"]}».')
        elif kind == 'number':
            value = number(value, f['label'], f.get('min', -1000000), f.get('max', 1000000))
        elif kind == 'choice':
            if not isinstance(value, str) or value not in f['options']:
                raise ValueError(f'Elige una opción válida en «{f["label"]}».')
        elif kind == 'checkbox' and not isinstance(value, bool):
            raise ValueError(f'Revisa la casilla «{f["label"]}».')
        result[key] = value
    return result


def rubric_assessment(rubric, selections, feedback, points):
    criteria = rubric['criteria']
    if not isinstance(selections, dict) or set(selections) != {c['id'] for c in criteria}:
        raise ValueError('Selecciona un nivel para cada criterio de la rúbrica.')
    if not isinstance(feedback, dict) or set(feedback) - set(selections):
        raise ValueError('Revisa los comentarios por criterio.')
    total, maximum, comments = 0, 0, {}
    for c in criteria:
        level = next((l for l in c['levels'] if l['id'] == selections[c['id']]), None)
        if level is None:
            raise ValueError('Uno de los niveles de la rúbrica no es válido.')
        total += level['points']; maximum += max(l['points'] for l in c['levels'])
        comments[c['id']] = short(feedback.get(c['id'], ''), 'el comentario del criterio', 1000, False)
    grade = int((Decimal(total) * Decimal(points) / Decimal(maximum)).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    return {'selections': selections, 'feedback': comments, 'total': total, 'maximum': maximum, 'grade': grade}
