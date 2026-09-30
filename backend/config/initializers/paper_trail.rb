# frozen_string_literal: true

ENV['PAPER_TRAIL_DISABLE_DATABASE_CHECK'] = 'true'
PaperTrail.config.enabled = true
PaperTrail.config.has_paper_trail_defaults = {
  on: %i[create update destroy]
}
