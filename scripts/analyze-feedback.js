#!/usr/bin/env node

/**
 * 베타 테스트 피드백 분석 스크립트
 * 수집된 피드백을 분석하여 인사이트를 제공합니다.
 */

const fs = require('fs');
const path = require('path');

// 피드백 데이터 구조
const FEEDBACK_CATEGORIES = {
  bug: '🐛 버그 신고',
  feature: '✨ 기능 제안',
  ui: '🎨 UI/UX 개선',
  performance: '⚡ 성능 이슈',
  other: '💬 기타'
};

const SEVERITY_LEVELS = {
  critical: { label: '🔴 Critical', priority: 1 },
  high: { label: '🟠 High', priority: 2 },
  medium: { label: '🟡 Medium', priority: 3 },
  low: { label: '🟢 Low', priority: 4 }
};

class FeedbackAnalyzer {
  constructor() {
    this.feedbackData = [];
    this.analysisResults = {
      summary: {},
      categories: {},
      ratings: {},
      commonIssues: [],
      recommendations: []
    };
  }

  // 피드백 데이터 로드 (실제 구현에서는 데이터베이스에서 가져옴)
  loadFeedbackData() {
    // 샘플 데이터 (실제로는 API나 데이터베이스에서 가져옴)
    this.feedbackData = [
      {
        id: 1,
        rating: 4,
        category: 'ui',
        description: '프로필 설정 단계가 너무 많아요. 3-4단계로 줄이면 좋겠어요.',
        email: 'user1@example.com',
        currentPage: '/profile/setup',
        timestamp: '2025-01-02T10:00:00Z',
        severity: 'medium'
      },
      {
        id: 2,
        rating: 5,
        category: 'feature',
        description: 'AI 루틴 생성이 정말 좋아요! 운동 동영상도 추가되면 완벽할 것 같아요.',
        email: 'user2@example.com',
        currentPage: '/routines/new',
        timestamp: '2025-01-02T11:30:00Z',
        severity: 'low'
      },
      {
        id: 3,
        rating: 2,
        category: 'bug',
        description: '캘린더에서 운동 체크가 안 되는 경우가 있어요. 새로고침하면 해결됩니다.',
        email: 'user3@example.com',
        currentPage: '/calendar',
        timestamp: '2025-01-02T14:15:00Z',
        severity: 'high'
      },
      {
        id: 4,
        rating: 3,
        category: 'performance',
        description: '루틴 생성할 때 로딩이 너무 오래 걸려요. 30초 정도 기다렸어요.',
        email: 'user4@example.com',
        currentPage: '/routines/new',
        timestamp: '2025-01-02T16:45:00Z',
        severity: 'medium'
      },
      {
        id: 5,
        rating: 4,
        category: 'ui',
        description: '모바일에서 버튼이 너무 작아서 터치하기 어려워요.',
        email: 'user5@example.com',
        currentPage: '/routines',
        timestamp: '2025-01-02T18:20:00Z',
        severity: 'medium'
      }
    ];

    console.log(`📊 ${this.feedbackData.length}개의 피드백을 로드했습니다.`);
  }

  // 기본 통계 분석
  analyzeSummary() {
    const total = this.feedbackData.length;
    const avgRating = this.feedbackData.reduce((sum, item) => sum + item.rating, 0) / total;
    
    const ratingDistribution = {};
    const categoryDistribution = {};
    const severityDistribution = {};

    this.feedbackData.forEach(item => {
      // 별점 분포
      ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + 1;
      
      // 카테고리 분포
      categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1;
      
      // 심각도 분포
      severityDistribution[item.severity] = (severityDistribution[item.severity] || 0) + 1;
    });

    this.analysisResults.summary = {
      totalFeedback: total,
      averageRating: Math.round(avgRating * 10) / 10,
      ratingDistribution,
      categoryDistribution,
      severityDistribution
    };
  }

  // 카테고리별 상세 분석
  analyzeCategories() {
    const categories = {};

    Object.keys(FEEDBACK_CATEGORIES).forEach(category => {
      const categoryFeedback = this.feedbackData.filter(item => item.category === category);
      
      if (categoryFeedback.length > 0) {
        const avgRating = categoryFeedback.reduce((sum, item) => sum + item.rating, 0) / categoryFeedback.length;
        
        categories[category] = {
          name: FEEDBACK_CATEGORIES[category],
          count: categoryFeedback.length,
          averageRating: Math.round(avgRating * 10) / 10,
          feedback: categoryFeedback.map(item => ({
            rating: item.rating,
            description: item.description,
            severity: item.severity,
            page: item.currentPage
          }))
        };
      }
    });

    this.analysisResults.categories = categories;
  }

  // 공통 이슈 식별
  identifyCommonIssues() {
    const issues = [];
    const keywords = {
      '로딩': ['로딩', '느려', '오래', '기다려'],
      '버튼': ['버튼', '터치', '클릭', '작아'],
      '프로필': ['프로필', '설정', '단계', '많아'],
      '캘린더': ['캘린더', '체크', '안 되', '새로고침'],
      '루틴': ['루틴', '생성', '편집', '수정']
    };

    Object.entries(keywords).forEach(([issue, words]) => {
      const relatedFeedback = this.feedbackData.filter(item => 
        words.some(word => item.description.includes(word))
      );

      if (relatedFeedback.length > 1) {
        issues.push({
          issue,
          count: relatedFeedback.length,
          severity: this.calculateIssueSeverity(relatedFeedback),
          examples: relatedFeedback.slice(0, 3).map(item => item.description)
        });
      }
    });

    this.analysisResults.commonIssues = issues.sort((a, b) => b.count - a.count);
  }

  // 이슈 심각도 계산
  calculateIssueSeverity(feedback) {
    const severityScores = { critical: 4, high: 3, medium: 2, low: 1 };
    const avgScore = feedback.reduce((sum, item) => sum + severityScores[item.severity], 0) / feedback.length;
    
    if (avgScore >= 3.5) return 'critical';
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  // 개선 권장사항 생성
  generateRecommendations() {
    const recommendations = [];

    // 평균 별점이 낮은 경우
    if (this.analysisResults.summary.averageRating < 3.5) {
      recommendations.push({
        priority: 'high',
        category: 'overall',
        title: '전체적인 사용자 만족도 개선 필요',
        description: `평균 별점이 ${this.analysisResults.summary.averageRating}점으로 낮습니다. 주요 불만사항을 우선적으로 해결해야 합니다.`
      });
    }

    // 버그 카테고리가 많은 경우
    const bugCount = this.analysisResults.summary.categoryDistribution.bug || 0;
    if (bugCount > this.analysisResults.summary.totalFeedback * 0.3) {
      recommendations.push({
        priority: 'critical',
        category: 'bug',
        title: '버그 수정 우선 필요',
        description: `전체 피드백의 ${Math.round(bugCount / this.analysisResults.summary.totalFeedback * 100)}%가 버그 신고입니다. QA 프로세스를 강화해야 합니다.`
      });
    }

    // 성능 이슈가 많은 경우
    const perfCount = this.analysisResults.summary.categoryDistribution.performance || 0;
    if (perfCount > 0) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: '성능 최적화 필요',
        description: `${perfCount}건의 성능 관련 피드백이 있습니다. 로딩 시간과 응답성을 개선해야 합니다.`
      });
    }

    // UI/UX 개선 제안이 많은 경우
    const uiCount = this.analysisResults.summary.categoryDistribution.ui || 0;
    if (uiCount > this.analysisResults.summary.totalFeedback * 0.25) {
      recommendations.push({
        priority: 'medium',
        category: 'ui',
        title: 'UI/UX 개선 검토',
        description: `UI/UX 관련 피드백이 많습니다. 사용자 인터페이스를 재검토해야 합니다.`
      });
    }

    this.analysisResults.recommendations = recommendations.sort((a, b) => {
      const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // 분석 결과 출력
  printAnalysis() {
    console.log('\n📊 베타 테스트 피드백 분석 결과\n');
    console.log('='.repeat(50));

    // 요약 통계
    console.log('\n📈 요약 통계');
    console.log(`총 피드백: ${this.analysisResults.summary.totalFeedback}건`);
    console.log(`평균 별점: ${this.analysisResults.summary.averageRating}/5.0`);
    
    console.log('\n⭐ 별점 분포:');
    Object.entries(this.analysisResults.summary.ratingDistribution)
      .sort(([a], [b]) => b - a)
      .forEach(([rating, count]) => {
        const percentage = Math.round(count / this.analysisResults.summary.totalFeedback * 100);
        console.log(`  ${rating}점: ${count}건 (${percentage}%)`);
      });

    console.log('\n📂 카테고리 분포:');
    Object.entries(this.analysisResults.summary.categoryDistribution).forEach(([category, count]) => {
      const percentage = Math.round(count / this.analysisResults.summary.totalFeedback * 100);
      console.log(`  ${FEEDBACK_CATEGORIES[category]}: ${count}건 (${percentage}%)`);
    });

    // 공통 이슈
    if (this.analysisResults.commonIssues.length > 0) {
      console.log('\n🔍 공통 이슈:');
      this.analysisResults.commonIssues.forEach((issue, index) => {
        const severityIcon = SEVERITY_LEVELS[issue.severity].label;
        console.log(`  ${index + 1}. ${severityIcon} ${issue.issue} (${issue.count}건)`);
        console.log(`     예시: "${issue.examples[0]}"`);
      });
    }

    // 권장사항
    if (this.analysisResults.recommendations.length > 0) {
      console.log('\n💡 개선 권장사항:');
      this.analysisResults.recommendations.forEach((rec, index) => {
        const priorityIcon = SEVERITY_LEVELS[rec.priority].label;
        console.log(`  ${index + 1}. ${priorityIcon} ${rec.title}`);
        console.log(`     ${rec.description}`);
      });
    }

    console.log('\n='.repeat(50));
    console.log('분석 완료! 🎉');
  }

  // 분석 결과를 JSON 파일로 저장
  saveResults() {
    const outputPath = path.join(__dirname, '../docs/feedback-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(this.analysisResults, null, 2));
    console.log(`\n💾 분석 결과가 저장되었습니다: ${outputPath}`);
  }

  // 전체 분석 실행
  run() {
    console.log('🚀 베타 테스트 피드백 분석을 시작합니다...\n');
    
    this.loadFeedbackData();
    this.analyzeSummary();
    this.analyzeCategories();
    this.identifyCommonIssues();
    this.generateRecommendations();
    this.printAnalysis();
    this.saveResults();
  }
}

// 스크립트 실행
if (require.main === module) {
  const analyzer = new FeedbackAnalyzer();
  analyzer.run();
}

module.exports = FeedbackAnalyzer;